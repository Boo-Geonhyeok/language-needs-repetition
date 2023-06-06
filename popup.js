const taskInput = document.getElementById('taskInput');
const addTask = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const toggleDisplay = document.getElementById('toggleDisplay');
const fontSizeChanger = document.getElementById('fontSize');
const mute = document.getElementById('mute');

let tasks = [];
let tasksWithAudio = []
// chrome.storage.sync.clear()
// chrome.storage.local.clear()


chrome.storage.sync.get(['displayActive', 'isMuted', 'fontSize'],  (data) => {
    displayActive = data.displayActive;
    isMuted = data.isMuted;

    if (data.displayActive == true) {
      toggleDisplay.textContent = 'Stop'
  } else {
      toggleDisplay.textContent = 'Start'
  }
  if (data.isMuted == true) {
    mute.textContent = 'Unmute'
} else {
    mute.textContent = 'Mute'
}
    if (data.fontSize) {
      fontSizeChanger.value = data.fontSize;
    }
  });

function saveTasks() {
  let onlyTasks = tasks.map(({ audio, ...item }) => item); 
  chrome.storage.sync.set({ tasks: onlyTasks });
}

function loadTasks() {
  chrome.storage.sync.get(['tasks'], (data) => {
    if (data.tasks) {
      tasks = data.tasks
    }

    let audioURL;
    chrome.storage.local.get(['tasks'], (data) => {
      if (data.tasks){
        tasksWithAudio = data.tasks
        tasks = tasks.map(obj1 => {
          const obj2 = tasksWithAudio.find(obj2 => obj2.task === obj1.task);
          console.log(obj2);
          if (obj2 != null && obj2.hasOwnProperty('audio')) {
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
        });
      }

      tasks.forEach((taskObj,index) => addTaskToList(taskObj,index));
    })
  })
}

function addTaskToList(taskObj, index) {
  const li = document.createElement('li');
  li.id = "meTask"
  const taskText = document.createElement('span');
  taskText.textContent = taskObj.task;

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => {
    taskText.contentEditable = 'true';
    taskText.focus();
    editButton.style.display = 'none';
    saveButton.style.display = 'inline';
  });

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.style.display = 'none';
  saveButton.addEventListener('click', () => {
    const newText = taskText.textContent.trim();
    if (newText) {
      taskObj.task = newText
      taskText.textContent = newText;
      saveTasks();
    }
    taskText.contentEditable = 'false';
    editButton.style.display = 'inline';
    saveButton.style.display = 'none';
  });

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.addEventListener('click', () => {
    tasks.splice(index,1)
    tasksWithAudio.splice(index,1)
    taskList.removeChild(li);
    chrome.storage.local.set({ tasks: tasksWithAudio });
    saveTasks();
  });

  const recordButton = document.createElement('button');
  recordButton.textContent = '\uD83D\uDD0A';
  if (!taskObj.audio) {
    recordButton.style.display = 'none';
  }
  recordButton.addEventListener('click', () => {
    taskObj.audio.play()
})

  li.appendChild(taskText);
  li.appendChild(recordButton);
  li.appendChild(editButton);
  li.appendChild(saveButton);
  li.appendChild(removeButton);
  taskList.appendChild(li);
}

addTask.addEventListener('click', () => {
  const task = taskInput.value.trim();
  if (task) {
    tasks.push({task: task});
    addTaskToList({task: task});
    saveTasks();
    taskInput.value = '';
  }
});

toggleDisplay.addEventListener('click', () => {
  displayActive = !displayActive;
  toggleDisplay.textContent = displayActive ? 'Stop' : 'Start';
  chrome.storage.sync.set({ displayActive });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { displayActive });
  });
});

fontSizeChanger.addEventListener('change', () => {
    fontSize = fontSizeChanger.value;
    chrome.storage.sync.set({ fontSize });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { fontSize });
    });
})

mute.addEventListener('click', () => {
  isMuted = !isMuted;
  mute.textContent = isMuted ? 'Unmute' : 'Mute';
  chrome.storage.sync.set({ isMuted });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { isMuted });
  });
});

loadTasks();
