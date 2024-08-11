document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        fileInput: document.getElementById('fileInput'),
        nameInput: document.getElementById('nameInput'),
        originInput: document.getElementById('originInput'),
        submissionInput: document.getElementById('submissionInput'),
        uploadButton: document.getElementById('uploadButton'),
        uploadContainer: document.getElementById('uploadContainer'),
        processingContainer: document.getElementById('processingContainer'),
        resultContainer: document.getElementById('resultContainer'),
        videoPlayer: document.getElementById('videoPlayer'),
        backButton: document.getElementById('backButton'),
        hostContainer: document.getElementById('hostContainer'),
        timerElement: document.getElementById('timer'),
        controlButtons: document.getElementById('controlButtons'),
        prevButton: document.getElementById('prevButton'),
        nextButton: document.getElementById('nextButton'),
        restartButton: document.getElementById('restartButton'),
        popupContainer: document.getElementById('popupContainer'),
        funFactElement: document.getElementById('funFact')
    };

    let jsonResponse = null;
    let currentStep = 0;
    let isPerformanceStarted = false;
    let timer;
    let startTime;

    // Initialize event listeners
    if (elements.uploadButton) {
        elements.uploadButton.addEventListener('click', handleUpload);
    }

    if (elements.prevButton) {
        elements.prevButton.addEventListener('click', handlePrevious);
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', handleNext);
    }

    if (elements.restartButton) {
        elements.restartButton.addEventListener('click', handleRestart);
    }

    if (elements.backButton) {
        elements.backButton.addEventListener('click', resetView);
    }

    function handleUpload() {
        if (validateForm()) {
            const formData = new FormData();
            formData.append('file', elements.fileInput.files[0]);
            formData.append('name', elements.nameInput.value);
            formData.append('origin', elements.originInput.value);
            formData.append('submission_details', elements.submissionInput.value);

            elements.uploadContainer.style.display = 'none';
            elements.processingContainer.style.display = 'block';
            startTimer();

            fetch('/', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                stopTimer();
                jsonResponse = data;
                showResult(elements.fileInput.files[0]);
                initializePerformance(jsonResponse);
            })
            .catch((error) => {
                console.error('Error:', error);
                stopTimer();
                alert(`An error occurred: ${error.message}\nPlease check the console for more details.`);
                resetView();
            });
        }
    }

    function validateForm() {
        if (elements.fileInput.files.length === 0) {
            alert('Please select a video file.');
            return false;
        }
        if (!elements.nameInput.value) {
            alert('Please enter your name.');
            return false;
        }
        if (!elements.originInput.value) {
            alert('Please enter your origin.');
            return false;
        }
        if (!elements.submissionInput.value) {
            alert('Please describe your submission.');
            return false;
        }
        if (elements.nameInput.value.length > 100) {
            alert('Name should be 100 characters or less.');
            return false;
        }
        if (elements.originInput.value.length > 100) {
            alert('Origin should be 100 characters or less.');
            return false;
        }
        if (elements.submissionInput.value.length > 500) {
            alert('Submission description should be 500 characters or less.');
            return false;
        }
        return true;
    }

    function showResult(file) {
        elements.processingContainer.style.display = 'none';
        elements.resultContainer.style.display = 'block';
        elements.hostContainer.style.display = 'block';
        elements.controlButtons.style.display = 'block';
        
        const videoURL = URL.createObjectURL(file);
        elements.videoPlayer.src = videoURL;
    }

    function initializePerformance(response) {
        try {
            console.log("Received response:", response);
    
            if (!response || typeof response !== 'object') {
                throw new Error("Invalid response: response is not an object.");
            }
            if (!Array.isArray(response.script)) {
                throw new Error("Invalid response structure: 'script' is not an array.");
            }
    
            const script = response.script;
            if (script.length === 0) {
                throw new Error("Invalid response structure: 'script' array is empty.");
            }
    
            script.forEach((entry, index) => {
                if (!entry.speaker || !entry.text || !entry.time) {
                    throw new Error(`Invalid entry in script at index ${index}: missing required fields.`);
                }
                console.log(`${entry.time} - ${entry.speaker}: ${entry.text}`);
            });
    
            currentStep = 0;
            isPerformanceStarted = false;
            showCurrentStep();
    
        } catch (error) {
            console.error("Error processing AI response:", error);
            alert("Sorry, there was an issue processing the AI's response: " + error.message);
            resetView();
        }
    }
    
    function convertTimeToSeconds(timeStr) {
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
    }

    function showCurrentStep() {
        if (!jsonResponse || !Array.isArray(jsonResponse.script)) {
            console.error('Invalid JSON Response');
            return;
        }
    
        if (currentStep < 0 || currentStep >= jsonResponse.script.length) {
            console.error('Current step out of bounds');
            return;
        }
    
        const step = jsonResponse.script[currentStep];
        console.log('Current step:', step);
    
        removeAllPopups();
    
        if (step.speaker === 'Participant' && !isPerformanceStarted) {
            console.log('Starting performance');
            elements.videoPlayer.currentTime = 0;
            elements.videoPlayer.play();
            isPerformanceStarted = true;
        } else {
            if (step.time) {
                elements.videoPlayer.currentTime = convertTimeToSeconds(step.time);
            }
            showPopup(step.speaker, step.text);
        }
    }

    function showPopup(speaker, text) {
        console.log('Showing popup for:', speaker);
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.textContent = text;

        const speakerElement = document.querySelector(`[alt="${speaker}"]`);
        if (speakerElement) {
            const rect = speakerElement.getBoundingClientRect();
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
            console.log('Popup positioned at:', popup.style.left, popup.style.top);
        } else {
            console.log('Speaker element not found:', speaker);
            popup.style.position = 'fixed';
            popup.style.left = '50%';
            popup.style.top = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
        }

        elements.popupContainer.appendChild(popup);
    }

    function removeAllPopups() {
        while (elements.popupContainer.firstChild) {
            elements.popupContainer.removeChild(elements.popupContainer.firstChild);
        }
    }

    function startTimer() {
        startTime = Date.now();
        timer = setInterval(updateTimer, 100);
    }

    function updateTimer() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        elements.timerElement.textContent = `Elapsed time: ${elapsedTime.toFixed(1)}s`;
    }

    function stopTimer() {
        clearInterval(timer);
    }

    function resetView() {
        elements.uploadContainer.style.display = 'block';
        elements.processingContainer.style.display = 'none';
        elements.resultContainer.style.display = 'none';
        elements.hostContainer.style.display = 'none';
        elements.controlButtons.style.display = 'none';
        elements.fileInput.value = '';
        elements.nameInput.value = '';
        elements.originInput.value = '';
        elements.submissionInput.value = '';
        elements.videoPlayer.src = '';
        elements.timerElement.textContent = '00.0';
        removeAllPopups();
        jsonResponse = null;
        currentStep = 0;
        isPerformanceStarted = false;
    }

    function handlePrevious() {
        if (currentStep > 0) {
            currentStep--;
            showCurrentStep();
        }
    }

    function handleNext() {
        if (jsonResponse && Array.isArray(jsonResponse.script) && currentStep < jsonResponse.script.length - 1) {
            currentStep++;
            showCurrentStep();
        }
    }

    function handleRestart() {
        resetView();
        if (jsonResponse) {
            initializePerformance(jsonResponse);
        }
    }

    // Fun Facts
    const funFacts = [
        "Britain's Got Talent premiered on ITV in 2007 and quickly became one of the UK's most-watched TV shows.",
        "The show's format includes a variety of performances, from singing and dancing to magic and comedy.",
        "In 2010, the show's finale was watched by over 15 million viewers, making it one of the highest-rated TV shows in the UK.",
        "Simon Cowell, one of the original judges, is known for his blunt and often humorous feedback.",
        "The winner of Britain's Got Talent not only gets a cash prize but also earns a spot at the Royal Variety Performance.",
        "The show has featured a range of unique talents, from amazing singers and dancers to incredible magicians and even unusual acts like performing dogs and daring stunts.",
        "The show's success has led to international versions being produced in various countries around the world."
    ];
    
    if (elements.funFactElement) {
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        elements.funFactElement.textContent = randomFact;
    } else {
        console.warn("Element with id 'funFact' not found");
    }
});