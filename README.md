# Magic Buddy: Real-Time AI Conversation

A React application that creates an engaging, real-time voice conversation with a child based on an image.

## Features
- **Visual Intelligence**: Analyzes any image (or the default cute dinosaur) to start a context-aware conversation.
- **Voice Interaction**: Speaks to the child using a friendly voice and listens for their response using the Web Speech API.
- **Dynamic UI**: The AI can change the application's background color based on the conversation mood (Demonstrating Tool Calling).
- **Kid-Friendly Design**: Bright colors, simple animations, and easy controls.

## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Vanilla CSS (Modern, Responsive, Animated)
- **AI Logic**: OpenAI GPT-4o with Vision (Client-side integration for demo)
- **Audio**: Browser Native Web Speech API (Speech Synthesis & Recognition)

## Setup & Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173` (or the port shown in terminal).

4. **API Key**:
   - You will need an [OpenAI API Key](https://platform.openai.com/api-keys).
   - The first time you run the app, paste your key into the input field at the top.
   - The key is saved locally in your browser for convenience.

## Usage
1. Click **"Start Adventure!"** to begin.
2. The AI will look at the image and greet you.
3. Speak when the **Microphone** icon pulses red.
4. If your microphone isn't working, you can **type your answer** in the text box that appears.
5. Try saying things like:
   - "I love blue!" (Watch the background turn blue 🌊)
   - "Can he fly?" (Watch the background turn sky blue ☁️)
   - "Is he hungry for leaves?" (Watch the background turn green 🌿)

## Demo Mode (No API Key Required)
If you don't have an OpenAI API key or if your credits are exhausted, you can use the built-in **Demo Mode**.
- Click **"Try Demo Mode"** on the main screen (if no key is entered) or on the error screen.
- This closely simulates the real experience with a scripted, interactive conversation about the dinosaur.
- It tests all the UI features: Speech Synthesis, Recognition, Animations, and Background Color Changes.

## Troubleshooting
- **Microphone not working?**: Check your browser permissions. Ensure the site is allowed to use the microphone.
- **Red button not blinking?**: The app automatically tries to restart the listener if silence occurs. If it stops completely, try clicking the microphone icon to restart it manually.
- **"Connection Error"?**: Use the **Demo Mode** to verify the app's functionality without an internet/API connection.

## Project Structure
- `src/App.tsx`: Main application logic and state machine.
- `src/hooks/useSpeech.ts`: Custom hook managing Speech-to-Text and Text-to-Speech.
- `src/lib/openai.ts`: Integration with OpenAI API for Vision, Chat, and Tool Calling.
- `public/dino.svg`: Default illustration.
