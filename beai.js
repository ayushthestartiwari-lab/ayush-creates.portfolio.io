// Be AI - Coding Assistant Chatbot
class BeAI {
  constructor() {
    this.button = document.getElementById('beai-button');
    this.chat = document.getElementById('beai-chat');
    this.chatBox = document.getElementById('chat-box');
    this.input = document.getElementById('chat-input').querySelector('input');
    this.sendBtn = document.getElementById('chat-input').querySelector('button');
    this.closeBtn = document.getElementById('chat-close');

    this.setupEventListeners();
    this.codingKeywords = [
      'python', 'javascript', 'java', 'go', 'rust', 'html', 'css', 'react', 'vue', 'angular',
      'nodejs', 'express', 'django', 'flask', 'sql', 'database', 'api', 'rest', 'graphql',
      'function', 'class', 'variable', 'loop', 'array', 'object', 'string', 'number',
      'algorithm', 'data structure', 'async', 'promise', 'callback', 'middleware',
      'debugging', 'testing', 'unit test', 'integration test', 'git', 'github',
      'docker', 'kubernetes', 'devops', 'ci/cd', 'agile', 'scrum', 'design pattern',
      'oop', 'functional programming', 'recursion', 'optimization', 'memory', 'cpu',
      'code', 'program', 'debug', 'error', 'bug', 'fix', 'refactor', 'syntax',
      'library', 'framework', 'package', 'npm', 'pip', 'maven', 'gradle',
      'json', 'xml', 'yaml', 'regex', 'html', 'dom', 'event', 'listener',
      'component', 'hook', 'state', 'props', 'redux', 'vuex', 'store',
      'backend', 'frontend', 'fullstack', 'server', 'client', 'request', 'response',
      'authentication', 'authorization', 'jwt', 'oauth', 'hash', 'encrypt',
      'deployment', 'production', 'staging', 'environment', 'config', 'variable',
      'performance', 'scalability', 'load balancing', 'caching', 'cdn',
      'web development', 'mobile development', 'game development', 'machine learning',
      'ai', 'neural network', 'tensorflow', 'pytorch', 'numpy', 'pandas'
    ];
  }

  setupEventListeners() {
    this.button.addEventListener('click', () => this.toggleChat());
    this.closeBtn.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChat() {
    this.chat.classList.toggle('active');
    this.button.classList.toggle('active');
    if (this.chat.classList.contains('active')) {
      this.input.focus();
      this.addBotMessage("Hi! I'm Be AI 🤖. Ask me any coding or programming questions!");
    }
  }

  isCodingQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Check if contains coding keywords
    const hasCodingKeyword = this.codingKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );

    // Common coding patterns
    const codingPatterns = [
      /how to\s+(write|create|build|develop|code|implement|fix|debug)/i,
      /what\s+is\s+(a\s+)?(function|class|variable|array|object|loop|api|database|framework|library)/i,
      /how do i\s+(write|create|use|import|export|install|set up)/i,
      /error|exception|bug|fix|crash|issue|problem|broken|not working/i,
      /code|script|program|algorithm|syntax|library|framework|package/i,
      /javascript|python|java|go|rust|typescript|react|vue|angular|nodejs|django|flask/i,
    ];

    const matchesPattern = codingPatterns.some(pattern => pattern.test(question));

    return hasCodingKeyword || matchesPattern;
  }

  async getAIResponse(question) {
    try {
      // Using HuggingFace's free API for coding questions
      const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
        headers: { Authorization: `Bearer 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` },
        method: 'POST',
        body: JSON.stringify({
          inputs: `You are Be AI, a coding assistant. Answer the following coding question concisely and helpfully in 1-2 sentences: ${question}`,
          parameters: { max_length: 150 }
        }),
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const result = await response.json();
      
      if (result[0]?.generated_text) {
        // Extract just the answer part
        const answer = result[0].generated_text.split('Answer:')[1] || result[0].generated_text;
        return answer.trim().substring(0, 500);
      }

      return await this.getLocalResponse(question);
    } catch (error) {
      console.log('Using local response due to API error');
      return await this.getLocalResponse(question);
    }
  }

  async getLocalResponse(question) {
    // Fallback local responses for common coding questions
    const responses = {
      'python': 'Python is a high-level, interpreted programming language known for its simplicity and readability. It\'s great for web development, data science, and automation. Start with basic syntax like variables, loops, and functions!',
      'javascript': 'JavaScript is the language of the web! It runs in browsers and powers interactive websites. Learn ES6 syntax, promises, async/await, and DOM manipulation. Popular frameworks: React, Vue, Angular.',
      'java': 'Java is an object-oriented language known for "Write Once, Run Anywhere". It\'s widely used in enterprise applications. Master OOP concepts, exception handling, and frameworks like Spring.',
      'function': 'A function is a reusable block of code that performs a specific task. Define it with parameters, call it when needed, and it returns a result. Functions help organize and modularize your code!',
      'array': 'An array is a data structure that stores multiple values in a single variable. Access elements by index, iterate with loops, and use methods like map(), filter(), reduce() for manipulation.',
      'loop': 'Loops execute code repeatedly. Common types: for (fixed iterations), while (condition-based), forEach (array iteration). They\'re essential for processing collections of data.',
      'api': 'An API (Application Programming Interface) allows different software to communicate. REST APIs use HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources. Master HTTP requests and JSON data formats!',
      'database': 'A database stores organized data. SQL databases (MySQL, PostgreSQL) use tables and relations. NoSQL databases (MongoDB) use flexible document structures. Learn queries, indexing, and data modeling!',
      'git': 'Git is version control software. Key commands: git init, git add, git commit, git push, git pull. It tracks changes, enables collaboration, and helps manage code versions.',
      'react': 'React is a JavaScript library for building UIs with reusable components. Master JSX syntax, hooks (useState, useEffect), props, state management, and lifecycle methods!',
      'node.js': 'Node.js runs JavaScript outside browsers, enabling server-side development. Create servers, handle requests, work with databases, and build REST APIs. Popular frameworks: Express, NestJS.',
      'error': 'Errors are common in programming! Read error messages carefully - they tell you what went wrong and where. Use debugging tools, console.log(), and IDEs to find and fix issues.',
      'async': 'Async programming handles long-running operations without blocking. Use callbacks, promises, or async/await syntax. Master asynchronous patterns to build responsive applications!',
      'oop': 'Object-Oriented Programming organizes code using objects, classes, inheritance, and polymorphism. It promotes code reusability, modularity, and maintainability.',
      'design pattern': 'Design patterns are proven solutions to common programming problems. Examples: Singleton, Factory, Observer, MVC. They improve code structure and team communication!',
      'default': 'That\'s a great coding question! I can help with languages (Python, JavaScript, Java, Go, Rust), frameworks (React, Django, Express), databases, APIs, and more. Ask specifically about syntax, concepts, or debugging!'
    };

    const lower = question.toLowerCase();
    for (const [key, value] of Object.entries(responses)) {
      if (lower.includes(key)) return value;
    }
    return responses['default'];
  }

  addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    messageDiv.innerHTML = `<div class="message-bubble">${this.escapeHtml(text)}</div>`;
    this.chatBox.appendChild(messageDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<div class="message-bubble">${this.escapeHtml(text)}</div>`;
    this.chatBox.appendChild(messageDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  addErrorMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot error';
    messageDiv.innerHTML = `<div class="message-bubble">${this.escapeHtml(text)}</div>`;
    this.chatBox.appendChild(messageDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    messageDiv.id = 'typing-indicator';
    messageDiv.innerHTML = `
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    this.chatBox.appendChild(messageDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    this.input.value = '';
    this.addUserMessage(message);

    if (!this.isCodingQuestion(message)) {
      this.addErrorMessage('❌ Invalid question type! I only answer coding and programming related questions. Ask me about Python, JavaScript, web development, databases, APIs, and more!');
      return;
    }

    this.addTypingIndicator();
    const response = await this.getAIResponse(message);
    this.removeTypingIndicator();
    this.addBotMessage('✅ ' + response);
  }
}

// Initialize Be AI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BeAI();
});
