![Google's Got Talent Logo](https://github.com/andrewankenobi/ggt/blob/main/static/images/logo.png)

## Recorded Demo

Check out a recorded demo of Google's Got Talent in action: [Watch the Demo](https://youtu.be/ncVm0vDYHx0)

## Overview

Google's Got Talent is an interactive web application that simulates a talent show experience using Google's Gemini AI. The application features virtual judges (Billie Joe Armstrong, Dave Grohl, Alanis Morissette, and Sara Bareilles) and is hosted by a virtual Sundar Pichai. Users can upload video performances, which are then evaluated by the AI-powered judges.

## Features

- Video upload functionality
- AI-powered performance evaluation
- Interactive judging experience with unique judge personalities
- Responsive design for various screen sizes

## Technology Stack

- Backend: Python with Flask
- Frontend: HTML, CSS, JavaScript
- AI: Google's Gemini AI model
- Cloud Infrastructure: Google Cloud

## Prerequisites

- Python 3.7+
- pip
- Google Cloud account with Gemini API access
- Google Cloud SDK (gcloud CLI)
- Git

## Setup

1. Clone the repository:
   ```
   git clone [repository-url]
   cd googles-got-talent
   ```

2. Set up a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Authenticate with Google Cloud:
   ```
   gcloud auth application-default login
   ```
   Follow the prompts to authenticate your Google Cloud account.

## Sample Videos and Descriptions

In the `templates/videos` directory, you will find:
- Three sample videos to test the technology
- Three related input descriptions

These samples can be used to quickly test the application and understand its functionality.

## Running the Application

1. Start the Flask server:
   ```
   python app.py
   ```

2. Open a web browser and navigate to `http://localhost:5000`

## Using the Demo

Once the application is deployed, follow these steps to use the demo:

1. On the main page, you'll see a form to upload a video performance.
2. Fill in the following details:
   - Name of the performer
   - Origin (where the performer is from)
   - Submission Description (details about the performance)
3. Upload a video file of the performance.
4. Click the "Upload Video" button to submit.
5. Wait for the AI to process the video and generate judges' responses.
6. Once processed, you'll see the virtual stage with:
   - Sundar Pichai as the host on the left
   - The uploaded video in the center
   - The panel of judges on the right
7. Use the control buttons to navigate through the judges' comments and decisions.
8. Enjoy the interactive talent show experience!

Note: You can use the sample videos and descriptions provided in the `templates/videos` directory to test the application.

## Project Structure

- `app.py`: Main Flask application
- `templates/`: HTML templates
- `static/`: CSS, JavaScript, and image files
- `uploads/`: Temporary storage for uploaded videos
- `responses/`: Storage for AI-generated responses
- `systemprompt.txt`: System prompt for the Gemini AI model

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Cloud and Gemini AI team for providing the underlying technology
- The Flask community for the web framework
- All contributors and testers who have helped shape this project

## Contact

Project maintained by: andrewankenobi@google.com

For any queries or support, please contact the project maintainer.
