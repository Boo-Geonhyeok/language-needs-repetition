chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.displayActive !== undefined) {
    if (request.displayActive) {
      startDisplayingTasks();
    } else {
      stopDisplayingTasks();
    }
  }
});

chrome.storage.sync.get('displayActive',  (data) => {
  if (data.displayActive == true) {
    startDisplayingTasks();
  }
});

let isMuted;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.isMuted !== undefined) {
    if (request.isMuted) {
      isMuted = true;
    } else {
      isMuted = false;
    }
  }
});

chrome.storage.sync.get('isMuted',  (data) => {
  if (data.isMuted == true) {
    isMuted = true;
  } else {
    isMuted = false;
  }
});

let taskDisplayInterval;
let taskIndex = 0;
const displayDuration = 5000; // 5 seconds

async function startDisplayingTasks()  {
  let taskAudio = await loadAudio()
  taskIndex = Math.floor(Math.random() * taskAudio.length);
  displayTask(taskAudio[taskIndex])
  clearInterval(taskDisplayInterval);
  taskDisplayInterval = setInterval(() => {
    taskIndex = (taskIndex + 1) % taskAudio.length;
    displayTask(taskAudio[taskIndex]);
  }, displayDuration);
  chrome.storage.sync.get(['taskDisplayPosition'], (data) => {
    if (data.taskDisplayPosition) {
      const taskDisplay = document.getElementById('taskDisplay');
      taskDisplay.style.left = `${data.taskDisplayPosition.left}px`;
      taskDisplay.style.top = `${data.taskDisplayPosition.top}px`;
    } else {
      const taskDisplay = document.getElementById('taskDisplay');
        taskDisplay.style.bottom = '10px';
        taskDisplay.style.left = '20px';
    }
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.fontSize !== undefined) {
        const taskDisplay = document.getElementById('taskDisplay');
        taskDisplay.style.fontSize = `${request.fontSize}px`;
      }
    });
  });
}


function stopDisplayingTasks() {
  clearInterval(taskDisplayInterval);
  const taskDisplay = document.getElementById('taskDisplay');
  if (taskDisplay) {
    taskDisplay.remove();
  }
}

function displayTask(taskObj) {
  let taskDisplay = document.getElementById('taskDisplay');
  if (!taskDisplay) {
    taskDisplay = createTaskDisplay();
    document.body.appendChild(taskDisplay);
  }
  taskDisplay.textContent = taskObj.task;
  taskDisplay.style.color = getRandomColor();
  if (taskObj.audio && !isMuted) {
    taskObj.audio.play();
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function createTaskDisplay() {
  const taskDisplay = document.createElement('div');
  taskDisplay.id = 'taskDisplay';
  taskDisplay.style.position = 'fixed';
  // taskDisplay.style.bottom = '10px';
  // taskDisplay.style.left = '20px';
  taskDisplay.style.padding = '10px';
  taskDisplay.style.zIndex = '9999';
  chrome.storage.sync.get('fontSize', (data) => {
    if (data.fontSize) {
      taskDisplay.style.fontSize = `${data.fontSize}px`;
    }
  })

  taskDisplay.addEventListener('mousedown', (e) => {
    const offsetX = e.clientX - taskDisplay.getBoundingClientRect().left;
    const offsetY = e.clientY - taskDisplay.getBoundingClientRect().top;

    function onMouseMove(e) {
      taskDisplay.style.right = 'auto';
      taskDisplay.style.bottom = 'auto';
      taskDisplay.style.left = `${e.clientX - offsetX}px`;
      taskDisplay.style.top = `${e.clientY - offsetY}px`;
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      saveTaskDisplayPosition(taskDisplay);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  return taskDisplay;
}

function saveTaskDisplayPosition(taskDisplay) {
  const taskDisplayPosition = {
    left: taskDisplay.offsetLeft,
    top: taskDisplay.offsetTop,
  };
  chrome.storage.sync.set({ taskDisplayPosition });
}







chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
  if(request.url !== undefined){
    recording()
  }
})

if (document.querySelector(".ytp-left-controls")) {
  recording()
}

function loadAudio() {
  return new Promise((resolve, reject) => {
    let taskAudio = [];
    chrome.storage.sync.get(['tasks'], (data) => {
      if (data.tasks) {
        taskAudio = data.tasks
      }
      let tasksWithAudio = []
      let audioURL;
      chrome.storage.local.get(['tasks'], async (data) => {
        if (data.tasks){
          tasksWithAudio = data.tasks
          taskAudio = await Promise.all(taskAudio.map(async (obj1) => {
            const obj2 = tasksWithAudio.find(obj2 => obj2.task === obj1.task);
            if (obj2.hasOwnProperty('audio')) {
              const base64Audio = obj2.audio;
              const contentType = 'audio/webm';
              const byteCharacters = atob(base64Audio.split(',')[1]);
              const byteNumbers = new Array(byteCharacters.length);
            
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
            
              const byteArray = new Uint8Array(byteNumbers);
              const audioBlob = new Blob([byteArray], { type: contentType });
            
              audioURL = new Audio(URL.createObjectURL(audioBlob));
            } else {
              audioURL = null
            }
            return {...obj1, audio: audioURL};
          }));
          resolve(taskAudio);
        } else {
          resolve(taskAudio);
        }
      })
    })
  })
}


function recording() {
  let youtubeControl = document.querySelector(".ytp-left-controls");
  let recordButton = document.createElement("button");
  recordButton.id = "recordButton"
  // recordButton.style.padding = 10
  recordButton.textContent = "Record";
  if (document.getElementById("recordButton") == null) {
    youtubeControl.appendChild(recordButton);
  }

let audioContext = null;
let mediaStreamSource = null;
let mediaRecorder = null;
let chunks = [];
let blob;

recordButton.addEventListener("click", async () => {
if (!audioContext) {
  audioContext = new AudioContext();
}

if (!mediaRecorder || mediaRecorder.state === "inactive") {
  const videoElement = document.querySelector("video");
  const stream = videoElement.captureStream();

  // Remove video tracks from the stream
  stream.getVideoTracks().forEach((track) => track.stop());

  mediaStreamSource = audioContext.createMediaStreamSource(stream);
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };
  
  mediaRecorder.onstop = () => {
    const video = document.querySelector('video');
    video.pause();

    const mimeType = "audio/webm";
    blob = new Blob(chunks, { type: mimeType });
    chunks = [];


      dialog = document.createElement("dialog")
      dialog.id = "dialog";
      document.body.appendChild(dialog)
      dialog.addEventListener("cancel", () => {
        dialog.remove();
      });
      loadTasks();
      dialog.showModal();
  }

  mediaRecorder.start();
  recordButton.textContent = "Stop";
} else if (mediaRecorder.state === "recording") {
  mediaRecorder.stop();
  recordButton.textContent = "Record";
}
});

let tasks = [];

function loadTasks() {
chrome.storage.sync.get(['tasks'], (data) => {
  if (data.tasks) {
    tasks = data.tasks;
    tasks.forEach((taskObj) => addTaskToList(taskObj));
  }
});
}

function addTaskToList(taskObj) {
const dialog = document.getElementById('dialog');
const li = document.createElement('li');
li.id = "meTask"
const taskText = document.createElement('span');
taskText.textContent = taskObj.task;

const saveButton = document.createElement('button');
saveButton.textContent = 'save';
saveButton.addEventListener('click', () => {
  saveAudio(blob, taskObj);
  dialog.close();
  dialog.remove();
});

li.appendChild(taskText);
li.appendChild(saveButton);
dialog.appendChild(li);
}

function saveAudio(audioBlob, taskObj) {
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = () => {
    let base64Audio = reader.result;
    taskObj.audio = base64Audio;
    chrome.storage.local.get(['tasks'], (data) => {
      if (data.tasks) {
        let localTasks = data.tasks;
        localTasks.push(taskObj)
        chrome.storage.local.set({ tasks: localTasks });
      } else {
        chrome.storage.local.set({ tasks });
      }
    });
  };
}
}

//원인은 sync에서 받아서 local에 저장하기 때문에 audio가 없는 sync가 계속 들어온다는 점

