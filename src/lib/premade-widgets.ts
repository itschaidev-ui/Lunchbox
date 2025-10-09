import type { Tool } from './types';

export const premadeWidgets: Tool[] = [
  {
    id: 'premade-todo',
    name: 'To-Do List',
    isPremade: true,
    code: {
      html: `
        <div class="todo-container">
          <input type="text" id="todo-input" placeholder="Add a new task...">
          <button id="add-task-btn">Add Task</button>
          <ul id="task-list"></ul>
        </div>
      `,
      css: `
        .todo-container {
          background: #2d2d2d;
          padding: 20px;
          border-radius: 8px;
          color: white;
          width: 300px;
        }
        #todo-input {
          width: calc(100% - 22px);
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #333;
          color: white;
          margin-bottom: 10px;
        }
        #add-task-btn {
          width: 100%;
          padding: 10px;
          border: none;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 4px;
          cursor: pointer;
        }
        #task-list {
          list-style-type: none;
          padding: 0;
          margin-top: 10px;
        }
        #task-list li {
          background: #444;
          padding: 10px;
          margin-bottom: 5px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #task-list li.completed {
          text-decoration: line-through;
          opacity: 0.6;
        }
        #task-list li button {
          background: transparent;
          border: none;
          color: #ff5c5c;
          cursor: pointer;
        }
      `,
      js: `
        const input = document.getElementById('todo-input');
        const addBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');

        addBtn.addEventListener('click', () => {
          const taskText = input.value.trim();
          if (taskText) {
            addTask(taskText);
            input.value = '';
          }
        });

        function addTask(text) {
          const li = document.createElement('li');
          li.textContent = text;
          
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = '✕';
          deleteBtn.addEventListener('click', () => {
            li.remove();
          });
          
          li.addEventListener('click', () => {
            li.classList.toggle('completed');
          });

          li.appendChild(deleteBtn);
          taskList.appendChild(li);
        }
      `,
    },
  },
  {
    id: 'premade-notes',
    name: 'Quick Notes',
    isPremade: true,
    code: {
      html: `
        <div class="notes-container">
          <textarea id="notes-area" placeholder="Jot down your thoughts..."></textarea>
        </div>
      `,
      css: `
        .notes-container {
          width: 300px;
          height: 250px;
        }
        #notes-area {
          width: 100%;
          height: 100%;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #444;
          background: #2d2d2d;
          color: white;
          font-family: inherit;
          resize: none;
          box-sizing: border-box;
        }
      `,
      js: `
        const notesArea = document.getElementById('notes-area');
        const savedNotes = localStorage.getItem('quick-notes-widget');
        if (savedNotes) {
          notesArea.value = savedNotes;
        }
        notesArea.addEventListener('input', () => {
          localStorage.setItem('quick-notes-widget', notesArea.value);
        });
      `,
    },
  },
  {
    id: 'premade-calendar',
    name: 'Simple Calendar',
    isPremade: true,
    code: {
      html: `
        <div class="calendar-container">
          <div class="calendar-header">
            <button id="prev-month">&lt;</button>
            <h2 id="month-year"></h2>
            <button id="next-month">&gt;</button>
          </div>
          <div class="calendar-grid"></div>
        </div>
      `,
      css: `
        .calendar-container {
          width: 320px;
          padding: 15px;
          background: #2d2d2d;
          border-radius: 8px;
          color: white;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .calendar-header h2 { margin: 0 10px; font-size: 1.1em; }
        .calendar-header button { background: transparent; border: none; color: hsl(var(--primary)); font-size: 1.5em; cursor: pointer; }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }
        .calendar-grid > div {
          text-align: center;
          padding: 8px 0;
          font-size: 0.9em;
        }
        .day-name { font-weight: bold; color: #888; }
        .day-number.today { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 50%; }
        .day-number.other-month { opacity: 0.3; }
      `,
      js: `
        const monthYearEl = document.getElementById('month-year');
        const gridEl = document.querySelector('.calendar-grid');
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        let currentDate = new Date();

        function renderCalendar() {
          gridEl.innerHTML = '';
          const today = new Date();
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          
          monthYearEl.textContent = \`\${currentDate.toLocaleString('default', { month: 'long' })} \${year}\`;
          
          const firstDayOfMonth = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          ['S','M','T','W','T','F','S'].forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'day-name';
            dayNameEl.textContent = day;
            gridEl.appendChild(dayNameEl);
          });
          
          for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyEl = document.createElement('div');
            gridEl.appendChild(emptyEl);
          }

          for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day-number';
            dayEl.textContent = i;
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
              dayEl.classList.add('today');
            }
            gridEl.appendChild(dayEl);
          }
        }

        prevBtn.addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() - 1);
          renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() + 1);
          renderCalendar();
        });

        renderCalendar();
      `,
    },
  },
  {
    id: 'premade-habit',
    name: 'Daily Habit Tracker',
    isPremade: true,
    code: {
      html: `
        <div class="habit-container">
          <h3>My Habit: Drink Water</h3>
          <div class="habit-grid"></div>
        </div>
      `,
      css: `
        .habit-container { width: 300px; background: #2d2d2d; border-radius: 8px; padding: 20px; color: white; }
        .habit-container h3 { text-align: center; margin-top: 0; margin-bottom: 15px; }
        .habit-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .habit-day { width: 30px; height: 30px; background: #444; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .habit-day.completed { background: hsl(var(--accent)); }
      `,
      js: `
        const grid = document.querySelector('.habit-grid');
        const habitKey = 'habit-tracker-water';
        let completedDays = JSON.parse(localStorage.getItem(habitKey) || '{}');

        for (let i = 1; i <= 31; i++) {
          const day = document.createElement('div');
          day.classList.add('habit-day');
          day.dataset.day = i;
          if (completedDays[i]) {
            day.classList.add('completed');
          }
          day.addEventListener('click', () => {
            day.classList.toggle('completed');
            completedDays[i] = day.classList.contains('completed');
            localStorage.setItem(habitKey, JSON.stringify(completedDays));
          });
          grid.appendChild(day);
        }
      `,
    },
  },
  {
    id: 'premade-pomodoro',
    name: 'Pomodoro Timer',
    isPremade: true,
    code: {
      html: `
        <div class="pomodoro-container">
          <div id="pomodoro-time">25:00</div>
          <div class="pomodoro-controls">
            <button id="pomodoro-start">Start</button>
            <button id="pomodoro-reset">Reset</button>
          </div>
        </div>
      `,
      css: `
        .pomodoro-container { width: 220px; text-align: center; background: #2d2d2d; padding: 25px; border-radius: 50%; color: white; width: 220px; height: 220px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        #pomodoro-time { font-size: 3em; font-weight: bold; margin-bottom: 15px; }
        .pomodoro-controls button { padding: 8px 16px; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer; }
        #pomodoro-start { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
        #pomodoro-reset { background: #555; color: white; }
      `,
      js: `
        const timeEl = document.getElementById('pomodoro-time');
        const startBtn = document.getElementById('pomodoro-start');
        const resetBtn = document.getElementById('pomodoro-reset');
        
        let interval;
        let timeLeft = 25 * 60;

        function updateTime() {
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          timeEl.textContent = \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
        }

        startBtn.addEventListener('click', () => {
          if (interval) {
            clearInterval(interval);
            interval = null;
            startBtn.textContent = 'Start';
          } else {
            interval = setInterval(() => {
              timeLeft--;
              if (timeLeft < 0) {
                clearInterval(interval);
                interval = null;
                alert('Time for a break!');
                timeLeft = 5 * 60;
              }
              updateTime();
            }, 1000);
            startBtn.textContent = 'Pause';
          }
        });

        resetBtn.addEventListener('click', () => {
          clearInterval(interval);
          interval = null;
          timeLeft = 25 * 60;
          updateTime();
          startBtn.textContent = 'Start';
        });

        updateTime();
      `,
    },
  },
  {
    id: 'premade-quote',
    name: 'Quote of the Day',
    isPremade: true,
    code: {
      html: `
        <div class="quote-container">
          <p id="quote-text">Loading...</p>
          <p id="quote-author"></p>
        </div>
      `,
      css: `
        .quote-container { width: 350px; background: #2d2d2d; padding: 25px; border-radius: 8px; color: white; text-align: center; border-left: 3px solid hsl(var(--accent)); }
        #quote-text { font-style: italic; font-size: 1.1em; margin: 0 0 10px 0; }
        #quote-author { font-weight: bold; }
      `,
      js: `
        const quoteText = document.getElementById('quote-text');
        const quoteAuthor = document.getElementById('quote-author');
        
        fetch('https://api.quotable.io/random')
          .then(res => res.json())
          .then(data => {
            quoteText.textContent = \`"\${data.content}"\`;
            quoteAuthor.textContent = \`- \${data.author}\`;
          })
          .catch(err => {
            quoteText.textContent = "Could not fetch quote.";
            console.error(err);
          });
      `,
    },
  },
  {
    id: 'premade-bookmark',
    name: 'Link Bookmark',
    isPremade: true,
    code: {
      html: `
        <div class="bookmark-container">
          <a id="bookmark-link" href="https://firebase.google.com/" target="_blank">
            <h4 id="bookmark-title">Firebase</h4>
            <p id="bookmark-desc">The official Firebase website.</p>
          </a>
        </div>
      `,
      css: `
        .bookmark-container { width: 280px; }
        #bookmark-link {
          display: block;
          padding: 15px;
          background: #2d2d2d;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
          text-decoration: none;
          transition: border-color 0.2s;
        }
        #bookmark-link:hover { border-color: hsl(var(--primary)); }
        #bookmark-title { margin: 0 0 5px 0; font-size: 1.1em; }
        #bookmark-desc { margin: 0; font-size: 0.9em; color: #aaa; }
      `,
      js: ``,
    },
  },
  {
    id: 'premade-counter',
    name: 'Simple Counter',
    isPremade: true,
    code: {
      html: `
        <div class="counter-container">
          <button id="counter-minus">-</button>
          <span id="counter-value">0</span>
          <button id="counter-plus">+</button>
        </div>
      `,
      css: `
        .counter-container {
          width: 200px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: #2d2d2d;
          padding: 20px;
          border-radius: 8px;
          color: white;
        }
        #counter-value { font-size: 2em; font-weight: bold; }
        .counter-container button {
          width: 40px;
          height: 40px;
          border: none;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          font-size: 1.5em;
          cursor: pointer;
        }
      `,
      js: `
        const valueEl = document.getElementById('counter-value');
        const plusBtn = document.getElementById('counter-plus');
        const minusBtn = document.getElementById('counter-minus');
        let count = 0;

        plusBtn.addEventListener('click', () => {
          count++;
          valueEl.textContent = count;
        });
        minusBtn.addEventListener('click', () => {
          count--;
          valueEl.textContent = count;
        });
      `,
    },
  },
  {
    id: 'premade-word',
    name: 'Word of the Day',
    isPremade: true,
    code: {
      html: `
        <div class="word-container">
          <h3 id="word-title">Loading...</h3>
          <p id="word-definition"></p>
        </div>
      `,
      css: `
        .word-container {
          width: 320px;
          background: #2d2d2d;
          padding: 20px;
          border-radius: 8px;
          color: white;
        }
        #word-title {
          margin: 0 0 10px 0;
          font-size: 1.4em;
          color: hsl(var(--primary));
        }
        #word-definition {
          margin: 0;
          font-size: 0.95em;
          color: #ccc;
        }
      `,
      js: `
        const titleEl = document.getElementById('word-title');
        const defEl = document.getElementById('word-definition');
        
        fetch('https://random-word-api.herokuapp.com/word')
          .then(res => res.json())
          .then(words => {
            const word = words[0];
            return fetch(\`https://api.dictionaryapi.dev/api/v2/entries/en/\${word}\`);
          })
          .then(res => res.json())
          .then(data => {
            const entry = data[0];
            titleEl.textContent = entry.word;
            defEl.textContent = entry.meanings[0].definitions[0].definition;
          })
          .catch(err => {
            titleEl.textContent = "Serendipity";
            defEl.textContent = "The occurrence and development of events by chance in a happy or beneficial way.";
            console.error(err);
          });
      `,
    },
  },
  {
    id: 'premade-clock',
    name: 'Digital Clock',
    isPremade: true,
    code: {
      html: `<div id="clock-container">12:00:00</div>`,
      css: `
        #clock-container {
          width: 280px;
          background: #2d2d2d;
          padding: 30px 20px;
          border-radius: 8px;
          color: hsl(var(--primary));
          text-align: center;
          font-size: 3em;
          font-family: 'Source Code Pro', monospace;
          font-weight: bold;
          letter-spacing: 2px;
        }
      `,
      js: `
        const clock = document.getElementById('clock-container');
        function updateClock() {
          const now = new Date();
          const timeString = now.toLocaleTimeString('en-US', { hour12: false });
          clock.textContent = timeString;
        }
        setInterval(updateClock, 1000);
        updateClock();
      `,
    },
  },
];
