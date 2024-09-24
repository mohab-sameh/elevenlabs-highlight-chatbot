import { useState, useRef } from 'react';

function App() {
  const [promptArea, setPromptArea] = useState('');
  const [promptResponse, setPromptResponse] = useState('');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Create refs
  const wordsRef = useRef([]);
  const currentWordIndexRef = useRef(0);

  const handleSubmit = async () => {
    const url = 'http://localhost:4444/api/prompt';
    var tmpPromptResponse = '';
    try {
      const response = await fetch(url , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptArea,
        }),
      });
      
      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: !readerDone });
          tmpPromptResponse += chunk;
          setPromptResponse(tmpPromptResponse);
        }
        done = readerDone;
      }

      // After the response is fully received and rendered
      const renderCompleteResponse = await fetch('http://localhost:4444/api/render_complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptArea,
          response: tmpPromptResponse,
        }),
      });

      const audioData = await renderCompleteResponse.json();
      // audioData contains 'audio_base64' and 'words'

      // Update state and refs
      setWords(audioData.words);
      wordsRef.current = audioData.words;

      // Convert base64 audio to Blob URL
      const audioBlob = base64ToBlob(audioData.audio_base64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Play the audio
      audio.play();

      // Set up interval to update current word index
      const intervalId = setInterval(() => {
        const currentTime = audio.currentTime;
        let index = wordsRef.current.findIndex(word => 
          currentTime >= word.start_time && currentTime <= word.end_time
        );
        if (index !== -1 && index !== currentWordIndexRef.current) {
          setCurrentWordIndex(index);
          currentWordIndexRef.current = index;
        }
      }, 50); // Check every 50ms

      // Clear the interval when audio ends
      audio.onended = () => {
        clearInterval(intervalId);
      };

    } catch (error) {
      console.log(error);
    }
  }

  function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    const sliceSize = 1024;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mime });
  }

  return (
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
      
      <div style={{order: 1, width: '80vh', paddingTop: '150px'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <h2 style={{order: -1}}>ElevenLabs Chatbot with Text Highlighting</h2>        
          <textarea                      
            rows={10}
            onChange={(e) => setPromptArea(e.target.value)}
            style={{order: 2, marginBottom: '1rem'}}
            value={promptArea}
            ></textarea>


          <div style={{order: 3}}>
            <button
              onClick={handleSubmit}
            >Submit</button>
          </div>

          <div style={{order: 4, marginTop: '1rem'}}>
            <h2>Response:</h2>
            <div>
              {words.length > 0 ? (
                words.map((wordObj, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: index === currentWordIndex ? 'yellow' : 'transparent'
                    }}
                  >
                    {wordObj.word + ' '}
                  </span>
                ))
              ) : (
                <span>{promptResponse}</span>
              )}
            </div>
          </div>

        </div>      
      </div>
    </div>
  );
}

export default App;
