# Streaming Chat Completion with Flask and React

This project demonstrates how to integrate ElevenLabs text-to-speech Websockets API (using [`elevenlabs-python`](https://github.com/elevenlabs/elevenlabs-python)) with OpenAI generates responses.

The app features word-by-word synchronized text highlighting with speech playback.

## Demo
<img src="https://elevenlabs.io/cover.png" 
alt="elevenlabs cover image" />

## Project Structure

This project contains two main directories:

1. `frontend`: This contains the React application that renders the chat interface.
2. `run.py`: This is the Flask server file that handles the backend operations.

## Setup

To set up this project, follow these steps:

1. Clone the repository to your local machine.
2. Install the necessary packages for both the frontend and backend.
3. Replace `OPEN_AI_KEY` in `run.py` with your actual OpenAI API key.
4. Replace `ELEVENLABS_API_KEY` in `run.py` with your actual ElevenLabs API key.
5. Start the Flask server by running `python run.py` in the main directory.
6. Start the React application by running `npm start` in the `frontend` directory.

Please note that the Flask server must be running in order for the React app to function properly.

### Frontend

To run the frontend:

```bash
npm install
```

```bash
npm start
```

### Backend

The backend server is a Flask application that communicates with ElevenLabs and OpenAI API.

The backend does the following:

1. receives the prompt given by the user
2. fetches a response from OpenAI
3. passes the response to the frontend
4. fetches text-to-speech data (base64) and timestamps from ElevenLabs
5. passes the audio and processed alignment to the frontend to be played and highlighted word-by-word

The server runs on port 4444, and CORS is handled globally.

To run the backend, activate venv:

```bash
python -m venv venv
```

```bash
source venv/bin/activate
```

then install the required packages:

```bash
pip install flask flask-cors requests sseclient-py elevenlabs
```

then run the backend:

```bash
python run.py
```
