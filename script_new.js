const projectLibrary = {
    python: [
        {
            name: 'Python',
            title: 'AI Weather Notifier',
            desc: 'Fetches real-time weather and sends desktop alerts.',
            code: 'import requests\nimport subprocess\n\ndef get_weather():\n    try:\n        response = requests.get("https://api.weather.gov/points/38.7,121.8")\n        data = response.json()\n        print(f"Weather: {data[\'properties\'][\'weather\']}")\n    except Exception as e:\n        print(f"Error: {e}")\n\nif __name__ == "__main__":\n    get_weather()',
        },
        {
            name: 'Python',
            title: 'Web Scraper with Beautiful Soup',
            desc: 'Extract data from websites automatically and save to CSV.',
            code: 'from bs4 import BeautifulSoup\nimport requests\nimport csv\n\ndef scrape_data(url):\n    response = requests.get(url)\n    soup = BeautifulSoup(response.content, "html.parser")\n    titles = soup.find_all("h2", class_="title")\n    \n    with open("data.csv", "w") as f:\n        writer = csv.writer(f)\n        for title in titles:\n            writer.writerow([title.text])\n    \n    print(f"Scraped {len(titles)} items")\n\nscrape_data("https://example.com")',
        }
    ],
    js: [
        {
            name: 'JavaScript',
            title: 'Glassmorphism Dashboard',
            desc: 'Real-time data binding with modern UI patterns.',
            code: 'const data = { users: 1234, revenue: 45000, growth: 23 };\n\nconst updateUI = (metrics) => {\n  document.getElementById("stats").innerHTML = `\n    <div class="stat">${metrics.users} Users</div>\n    <div class="stat">$${metrics.revenue} Revenue</div>\n    <div class="stat">+${metrics.growth}% Growth</div>\n  `;\n};\n\nsetInterval(() => updateUI(data), 5000);',
        },
        {
            name: 'JavaScript',
            title: 'Todo App with LocalStorage',
            desc: 'Build persistent task management with modern JS.',
            code: 'class TodoApp {\n    constructor() {\n        this.todos = JSON.parse(localStorage.getItem("todos")) || [];\n    }\n    \n    addTodo(task) {\n        this.todos.push({ id: Date.now(), task, done: false });\n        this.save();\n    }\n    \n    removeTodo(id) {\n        this.todos = this.todos.filter(t => t.id !== id);\n        this.save();\n    }\n    \n    save() {\n        localStorage.setItem("todos", JSON.stringify(this.todos));\n    }\n}\n\nconst app = new TodoApp();',
        }
    ],
    cpp: [
        {
            name: 'C++',
            title: 'High-Speed Game Engine',
            desc: 'Lightweight 2D engine with collision detection.',
            code: '#include <iostream>\n#include <vector>\n#include <cmath>\n\nclass GameObject {\npublic:\n    float x, y;\n    float vx = 0, vy = 0;\n    \n    void update(float dt) {\n        x += vx * dt;\n        y += vy * dt;\n    }\n    \n    float distance(const GameObject& other) {\n        return std::sqrt(std::pow(x - other.x, 2) + std::pow(y - other.y, 2));\n    }\n};\n\nint main() {\n    GameObject player = {0, 0};\n    player.vx = 10.0;\n    player.update(0.016);\n    std::cout << "Position: " << player.x << std::endl;\n    return 0;\n}',
        },
        {
            name: 'C++',
            title: 'Binary Search Tree Implementation',
            desc: 'Master data structures with efficient tree operations.',
            code: '#include <iostream>\n\nstruct Node {\n    int data;\n    Node* left;\n    Node* right;\n    \n    Node(int val) : data(val), left(nullptr), right(nullptr) {}\n};\n\nclass BST {\npublic:\n    Node* insert(Node* node, int val) {\n        if (node == nullptr) return new Node(val);\n        if (val < node->data)\n            node->left = insert(node->left, val);\n        else\n            node->right = insert(node->right, val);\n        return node;\n    }\n    \n    bool search(Node* node, int val) {\n        if (node == nullptr) return false;\n        if (node->data == val) return true;\n        return val < node->data ? search(node->left, val) : search(node->right, val);\n    }\n};\n\nint main() {\n    BST tree;\n    Node* root = nullptr;\n    root = tree.insert(root, 50);\n    root = tree.insert(root, 30);\n    std::cout << (tree.search(root, 30) ? "Found" : "Not found") << std::endl;\n    return 0;\n}',
        }
    ],
    java: [
        {
            name: 'Java',
            title: 'Enterprise REST API',
            desc: 'Build scalable APIs with Spring Boot and JPA.',
            code: 'import org.springframework.web.bind.annotation.*;\nimport org.springframework.beans.factory.annotation.Autowired;\n\n@RestController\n@RequestMapping("/api/users")\npublic class UserController {\n    @Autowired\n    private UserService userService;\n    \n    @GetMapping\n    public List<User> getAllUsers() {\n        return userService.findAll();\n    }\n    \n    @PostMapping\n    public User createUser(@RequestBody User user) {\n        return userService.save(user);\n    }\n    \n    @GetMapping("/{id}")\n    public User getUserById(@PathVariable Long id) {\n        return userService.findById(id).orElse(null);\n    }\n}',
        },
        {
            name: 'Java',
            title: 'Chat Application with Sockets',
            desc: 'Real-time messaging using Java networking.',
            code: 'import java.io.*;\nimport java.net.*;\n\npublic class ChatServer {\n    private ServerSocket serverSocket;\n    \n    public ChatServer(int port) throws IOException {\n        serverSocket = new ServerSocket(port);\n    }\n    \n    public void start() {\n        while (true) {\n            try {\n                Socket clientSocket = serverSocket.accept();\n                new ClientHandler(clientSocket).start();\n            } catch (IOException e) {\n                System.err.println("Connection error: " + e.getMessage());\n            }\n        }\n    }\n    \n    public static void main(String[] args) throws IOException {\n        new ChatServer(5000).start();\n    }\n}',
        }
    ],
    csharp: [
        {
            name: 'C#',
            title: 'Unity 3D Game Development',
            desc: 'Create immersive games with interactive mechanics.',
            code: 'using UnityEngine;\nusing UnityEngine.InputSystem;\n\npublic class PlayerController : MonoBehaviour {\n    public float speed = 10f;\n    public float jumpForce = 5f;\n    private Rigidbody rb;\n    \n    void Start() {\n        rb = GetComponent<Rigidbody>();\n    }\n    \n    void Update() {\n        Vector3 input = new Vector3(\n            Input.GetAxis("Horizontal"),\n            0,\n            Input.GetAxis("Vertical")\n        );\n        transform.Translate(input * speed * Time.deltaTime);\n        \n        if (Input.GetKeyDown(KeyCode.Space)) {\n            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);\n        }\n    }\n}',
        },
        {
            name: 'C#',
            title: 'WPF Desktop Application',
            desc: 'Build modern desktop apps with XAML and C#.',
            code: 'using System.Windows;\nusing System.Collections.ObjectModel;\n\npublic partial class MainWindow : Window {\n    public ObservableCollection<string> Items { get; set; }\n    \n    public MainWindow() {\n        InitializeComponent();\n        Items = new ObservableCollection<string>();\n        this.DataContext = this;\n    }\n    \n    private void AddButton_Click(object sender, RoutedEventArgs e) {\n        string newItem = InputTextBox.Text;\n        if (!string.IsNullOrEmpty(newItem)) {\n            Items.Add(newItem);\n            InputTextBox.Clear();\n        }\n    }\n    \n    private void RemoveButton_Click(object sender, RoutedEventArgs e) {\n        if (ItemsListBox.SelectedItem is string item) {\n            Items.Remove(item);\n        }\n    }\n}',
        }
    ],
    rust: [
        {
            name: 'Rust',
            title: 'High-Performance Search',
            desc: 'Blazing fast CLI tool for file indexing.',
            code: 'use std::fs;\nuse std::path::Path;\nuse std::time::Instant;\n\nfn index_files(dir: &Path) -> Vec<String> {\n    let mut files = Vec::new();\n    if let Ok(entries) = fs::read_dir(dir) {\n        for entry in entries.flatten() {\n            if let Ok(metadata) = entry.metadata() {\n                if metadata.is_file() {\n                    files.push(entry.path().display().to_string());\n                }\n            }\n        }\n    }\n    files\n}\n\nfn main() {\n    let start = Instant::now();\n    let files = index_files(Path::new("."));\n    let duration = start.elapsed();\n    \n    println!("Indexed {} files in {:?}", files.len(), duration);\n    for file in files.iter().take(10) {\n        println!("  - {}", file);\n    }\n}',
        },
        {
            name: 'Rust',
            title: 'Web Server with Tokio',
            desc: 'Async HTTP server with performance optimization.',
            code: 'use tokio::net::TcpListener;\nuse tokio::io::{AsyncReadExt, AsyncWriteExt};\n\n#[tokio::main]\nasync fn main() {\n    let listener = TcpListener::bind("127.0.0.1:8080")\n        .await\n        .expect("Failed to bind");\n    \n    println!("Server listening on 127.0.0.1:8080");\n    \n    loop {\n        let (mut socket, _) = listener.accept().await.unwrap();\n        \n        tokio::spawn(async move {\n            let mut buf = [0; 1024];\n            if let Ok(n) = socket.read(&mut buf).await {\n                let response = b"HTTP/1.1 200 OK\\r\\nContent-Length: 13\\r\\n\\r\\nHello, World!";\n                let _ = socket.write_all(response).await;\n            }\n        });\n    }\n}',
        }
    ],
    html: [
        {
            name: 'HTML',
            title: 'Responsive Portfolio Website',
            desc: 'Semantic HTML5 with modern design patterns.',
            code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Portfolio</title>\n    <style>\n        * { margin: 0; padding: 0; }\n        body { font-family: Arial, sans-serif; line-height: 1.6; }\n        header { background: #333; color: #fff; padding: 20px; text-align: center; }\n        nav { background: #444; padding: 10px; }\n        nav a { color: #fff; margin: 0 15px; text-decoration: none; }\n        main { max-width: 1200px; margin: 20px auto; padding: 20px; }\n        .project { background: #f4f4f4; padding: 20px; margin: 10px 0; border-radius: 5px; }\n    </style>\n</head>\n<body>\n    <header>\n        <h1>Welcome to My Portfolio</h1>\n    </header>\n    <nav>\n        <a href="#home">Home</a>\n        <a href="#projects">Projects</a>\n        <a href="#contact">Contact</a>\n    </nav>\n    <main>\n        <section id="projects">\n            <h2>My Projects</h2>\n            <div class="project">\n                <h3>Project 1</h3>\n                <p>Description of your first project...</p>\n            </div>\n        </section>\n    </main>\n</body>\n</html>',
        },
        {
            name: 'HTML',
            title: 'E-Commerce Landing Page',
            desc: 'Modern product showcase with interactive elements.',
            code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Shop | Premium Products</title>\n    <style>\n        body { font-family: "Segoe UI", sans-serif; }\n        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; }\n        .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 40px 20px; }\n        .product-card { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 20px; }\n        .product-card:hover { transform: translateY(-5px); }\n        .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }\n        .btn:hover { background: #764ba2; }\n    </style>\n</head>\n<body>\n    <div class="hero">\n        <h1>Premium Products Store</h1>\n        <p>Discover our exclusive collection</p>\n    </div>\n    <div class="products">\n        <div class="product-card">\n            <h3>Product 1</h3>\n            <p>High-quality premium product</p>\n            <button class="btn">Add to Cart</button>\n        </div>\n    </div>\n</body>\n</html>',
        }
    ]
};

// Helper function to get a random project from a language
function getRandomProject(lang) {
    const projects = projectLibrary[lang];
    if (Array.isArray(projects)) {
        return projects[Math.floor(Math.random() * projects.length)];
    }
    return projects;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');

    if (lang && projectLibrary[lang]) {
        const data = getRandomProject(lang);
        document.getElementById('lang-title').innerText = data.name;
        document.getElementById('project-name').innerText = data.title;
        document.getElementById('project-desc').innerText = data.desc;
        
        const codeElement = document.getElementById('code-display');
        codeElement.innerText = data.code;
        codeElement.className = `language-${lang}`;
        if (window.Prism) Prism.highlightElement(codeElement);
    }
});

function copyToClipboard() {
    const code = document.getElementById('code-display').innerText;
    navigator.clipboard.writeText(code).then(() => {
        const toast = document.getElementById('copy-toast');
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 2000);
    });
}

function downloadCode() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    const data = getRandomProject(lang);
    
    if (!data) return;
    
    const extensions = {
        python: 'py',
        js: 'js',
        cpp: 'cpp',
        java: 'java',
        csharp: 'cs',
        rust: 'rs',
        html: 'html'
    };
    
    const ext = extensions[lang] || 'txt';
    const filename = `${lang}-${data.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    
    const blob = new Blob([data.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const toast = document.getElementById('download-toast');
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 2000);
}
