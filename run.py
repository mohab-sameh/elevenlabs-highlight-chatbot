from flask import Flask, request, Response, stream_with_context, json
import requests
import sseclient
import base64
from elevenlabs.client import ElevenLabs
from elevenlabs import play, stream

app = Flask(__name__)

from flask_cors import CORS

OPEN_AI_KEY = 'your-openai-api-key'
ELEVENLABS_API_KEY = 'your-elevenlabs-api-key'
VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

# handle cors
CORS(app)

# create elevenlabs client
eleven_client = ElevenLabs(
  api_key=ELEVENLABS_API_KEY
)


@app.route('/')
def index():
    return 'Hello World!'

def get_word_alignment(alignment):
    characters = alignment['characters']
    start_times = alignment['character_start_times_seconds']
    end_times = alignment['character_end_times_seconds']
    words = []
    current_word = ''
    word_start_time = None
    word_end_time = None

    for i, char in enumerate(characters):
        if char.strip() == '' or char in ['.', ',', '?', '!', ';', ':']:
            # End of a word
            if current_word != '':
                words.append({
                    'word': current_word,
                    'start_time': word_start_time,
                    'end_time': word_end_time
                })
                current_word = ''
                word_start_time = None
                word_end_time = None
        else:
            if current_word == '':
                word_start_time = start_times[i]
            current_word += char
            word_end_time = end_times[i]

    # Add the last word if any
    if current_word != '':
        words.append({
            'word': current_word,
            'start_time': word_start_time,
            'end_time': word_end_time
        })

    return words

def get_audio_data(text_to_play):
    # Generate audio and alignment data using ElevenLabs SDK
    print("get_audio_data called")
    audio_stream = eleven_client.text_to_speech.convert_with_timestamps(
        voice_id=VOICE_ID,
        text=text_to_play,
    )
    # Process alignment data to get word-level alignment
    words = get_word_alignment(audio_stream['alignment'])
    # Return audio_base64 and word-level alignment data
    return {
        'audio_base64': audio_stream['audio_base64'],
        'words': words
    }

@app.route('/api/prompt', methods=['GET', 'POST'])
def prompt():
    if request.method == 'POST':
        prompt = request.json['prompt']
    
        def generate():
            url = 'https://api.openai.com/v1/chat/completions'
            headers = {
                'content-type': 'application/json; charset=utf-8',
                'Authorization': f"Bearer {OPEN_AI_KEY}"            
            }

            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {'role': 'system', 'content': 'You are an AI assistant that answers questions about anything.'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 1, 
                'max_tokens': 1000,
                'stream': True,            
            }

            response = requests.post(url, headers=headers, data=json.dumps(data), stream=True)
            client = sseclient.SSEClient(response)
            for event in client.events():
                if event.data != '[DONE]':
                    try:
                        text = json.loads(event.data)['choices'][0]['delta']['content']
                        yield(text)
                    except:
                        yield('')

        return Response(stream_with_context(generate()))

@app.route('/api/render_complete', methods=['POST'])
def render_complete():
    # Get data from the request
    data = request.json
    prompt = data.get('prompt', '')
    response_text = data.get('response', '')
    # Get audio data and alignment
    audio_data = get_audio_data(response_text)
    return app.response_class(
        response=json.dumps(audio_data),
        status=200,
        mimetype='application/json'
    )

if __name__ == '__main__':
    app.run(port=4444, debug=True)