const projectLibrary = {
    python: [
        {
            name: 'Python',
            title: 'AI Weather Notifier',
            desc: 'Fetches real-time weather and sends desktop alerts.',
            beginner: `print("Weather App")
print("Temperature: 25°C")
print("Humidity: 60%")`,
            advanced: `import requests
import json
from datetime import datetime

def get_weather(city):
    api_key = "your_api_key"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        temp = data['main']['temp']
        humidity = data['main']['humidity']
        weather = data['weather'][0]['description']
        
        print(f"City: {city}")
        print(f"Temperature: {temp}K")
        print(f"Humidity: {humidity}%")
        print(f"Weather: {weather}")
        
        return data
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return None

if __name__ == "__main__":
    get_weather("London")`,
        },
        {
            name: 'Python',
            title: 'Web Scraper',
            desc: 'Extract data from websites automatically.',
            beginner: `import requests

url = "https://example.com"
response = requests.get(url)

print("Status Code:", response.status_code)
print("Content Length:", len(response.text))`,
            advanced: `from bs4 import BeautifulSoup
import requests
import csv
from urllib.parse import urljoin

class WebScraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
    
    def scrape_products(self):
        response = self.session.get(self.base_url)
        soup = BeautifulSoup(response.content, "html.parser")
        
        products = []
        for item in soup.find_all("div", class_="product"):
            name = item.find("h2").text.strip()
            price = item.find("span", class_="price").text.strip()
            products.append({"name": name, "price": price})
        
        return products
    
    def save_to_csv(self, products):
        with open("products.csv", "w") as f:
            writer = csv.DictWriter(f, fieldnames=["name", "price"])
            writer.writeheader()
            writer.writerows(products)

scraper = WebScraper("https://example.com")
data = scraper.scrape_products()
scraper.save_to_csv(data)`,
        }
    ],
    js: [
        {
            name: 'JavaScript',
            title: 'Interactive Dashboard',
            desc: 'Real-time data binding with modern UI patterns.',
            beginner: `const data = {
  users: 1234,
  revenue: 45000
};

console.log("Users: " + data.users);
console.log("Revenue: $" + data.revenue);`,
            advanced: `class Dashboard {
    constructor() {
        this.data = {
            users: 1234,
            revenue: 45000,
            growth: 23
        };
        this.updateInterval = null;
    }
    
    fetchMetrics() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.users += Math.floor(Math.random() * 10);
                this.data.revenue += Math.floor(Math.random() * 1000);
                resolve(this.data);
            }, 1000);
        });
    }
    
    async updateUI() {
        const metrics = await this.fetchMetrics();
        const html = \`
            <div class="stat">
                <p>Users: \${metrics.users}</p>
            </div>
            <div class="stat">
                <p>Revenue: $\${metrics.revenue}</p>
            </div>
            <div class="stat">
                <p>Growth: +\${metrics.growth}%</p>
            </div>
        \`;
        document.getElementById("stats").innerHTML = html;
    }
    
    startAutoUpdate() {
        this.updateInterval = setInterval(() => this.updateUI(), 3000);
    }
}

const dashboard = new Dashboard();
dashboard.startAutoUpdate();`,
        },
        {
            name: 'JavaScript',
            title: 'Todo App',
            desc: 'Build persistent task management.',
            beginner: `const todos = [];

function addTodo(task) {
    todos.push(task);
    console.log("Added: " + task);
}

function showTodos() {
    console.log("Your todos:");
    todos.forEach((t, i) => {
        console.log((i + 1) + ". " + t);
    });
}

addTodo("Learn JavaScript");
addTodo("Build a project");
showTodos();`,
            advanced: `class TodoApp {
    constructor() {
        this.todos = this.loadFromStorage() || [];
        this.filters = {
            status: 'all',
            priority: 'all'
        };
    }
    
    loadFromStorage() {
        try {
            return JSON.parse(localStorage.getItem("todos")) || [];
        } catch (e) {
            console.error("Failed to load todos:", e);
            return [];
        }
    }
    
    addTodo(task, priority = 'normal') {
        const todo = {
            id: Date.now(),
            task,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.todos.push(todo);
        this.save();
        return todo;
    }
    
    completeTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = true;
            this.save();
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.save();
    }
    
    getFiltered() {
        return this.todos.filter(t => {
            const statusMatch = this.filters.status === 'all' ||
                (this.filters.status === 'done' && t.completed) ||
                (this.filters.status === 'pending' && !t.completed);
            const priorityMatch = this.filters.priority === 'all' ||
                t.priority === this.filters.priority;
            return statusMatch && priorityMatch;
        });
    }
    
    save() {
        localStorage.setItem("todos", JSON.stringify(this.todos));
    }
}

const app = new TodoApp();
app.addTodo("Learn async/await", "high");
app.addTodo("Build API project", "high");
app.addTodo("Study design patterns", "normal");`,
        }
    ],
    cpp: [
        {
            name: 'C++',
            title: 'Game Object System',
            desc: 'Lightweight 2D engine with collision detection.',
            beginner: `#include <iostream>
using namespace std;

struct GameObject {
    float x, y;
};

int main() {
    GameObject obj = {10, 20};
    cout << "Position: " << obj.x << ", "
         << obj.y << endl;
    return 0;
}`,
            advanced: `#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

class GameObject {
private:
    float x, y, width, height;
    float velocityX, velocityY;

public:
    GameObject(float x, float y, float w, float h)
        : x(x), y(y), width(w), height(h),
          velocityX(0), velocityY(0) {}

    void update(float deltaTime) {
        x += velocityX * deltaTime;
        y += velocityY * deltaTime;
    }

    void setVelocity(float vx, float vy) {
        velocityX = vx;
        velocityY = vy;
    }

    bool isColliding(const GameObject& other) const {
        return x < other.x + other.width &&
               x + width > other.x &&
               y < other.y + other.height &&
               y + height > other.y;
    }

    void draw() const {
        cout << "Drawing at (" << x << ", " << y << ")" << endl;
    }
};

int main() {
    GameObject player(0, 0, 10, 10);
    GameObject enemy(50, 0, 10, 10);

    player.setVelocity(30, 0);

    for (int i = 0; i < 5; i++) {
        player.update(0.016);
        cout << "Frame " << i << ": ";
        player.draw();

        if (player.isColliding(enemy)) {
            cout << "Collision detected!" << endl;
            break;
        }
    }

    return 0;
}`,
        },
        {
            name: 'C++',
            title: 'Binary Search Tree',
            desc: 'Master data structures with tree operations.',
            beginner: `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* left;
    Node* right;
};

int main() {
    Node* root = new Node();
    root->data = 50;
    root->left = nullptr;
    root->right = nullptr;

    cout << "Root value: " << root->data << endl;

    return 0;
}`,
            advanced: `#include <iostream>
#include <queue>
using namespace std;

struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};

class BST {
private:
    Node* root;

    Node* insertHelper(Node* node, int val) {
        if (node == nullptr) {
            return new Node(val);
        }
        if (val < node->data) {
            node->left = insertHelper(node->left, val);
        } else if (val > node->data) {
            node->right = insertHelper(node->right, val);
        }
        return node;
    }

    bool searchHelper(Node* node, int val) {
        if (node == nullptr) return false;
        if (node->data == val) return true;
        if (val < node->data) return searchHelper(node->left, val);
        return searchHelper(node->right, val);
    }

    void inorderHelper(Node* node) {
        if (node == nullptr) return;
        inorderHelper(node->left);
        cout << node->data << " ";
        inorderHelper(node->right);
    }

public:
    BST() : root(nullptr) {}

    void insert(int val) {
        root = insertHelper(root, val);
    }

    bool search(int val) {
        return searchHelper(root, val);
    }

    void inorder() {
        inorderHelper(root);
        cout << endl;
    }
};

int main() {
    BST tree;
    tree.insert(50);
    tree.insert(30);
    tree.insert(70);
    tree.insert(20);
    tree.insert(40);

    cout << "In-order traversal: ";
    tree.inorder();

    cout << "Search 40: " << (tree.search(40) ? "Found" : "Not Found") << endl;
    cout << "Search 100: " << (tree.search(100) ? "Found" : "Not Found") << endl;

    return 0;
}`,
        }
    ],
    java: [
        {
            name: 'Java',
            title: 'REST API Controller',
            desc: 'Build scalable APIs with Spring Boot.',
            beginner: `public class User {
    private int id;
    private String name;
    
    public User(int id, String name) {
        this.id = id;
        this.name = name;
    }
    
    public int getId() { return id; }
    public String getName() { return name; }
}`,
            advanced: `import java.util.*;
import java.util.stream.*;

public class UserController {
    private List<User> users = new ArrayList<>();
    
    public UserController() {
        users.add(new User(1, "Alice", "alice@example.com"));
        users.add(new User(2, "Bob", "bob@example.com"));
    }
    
    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }
    
    public User getUserById(int id) {
        return users.stream()
            .filter(u -> u.getId() == id)
            .findFirst()
            .orElse(null);
    }
    
    public boolean addUser(User user) {
        return users.add(user);
    }
    
    public boolean deleteUser(int id) {
        return users.removeIf(u -> u.getId() == id);
    }
    
    public List<User> searchByName(String name) {
        return users.stream()
            .filter(u -> u.getName().toLowerCase()
                .contains(name.toLowerCase()))
            .collect(Collectors.toList());
    }
}`,
        },
        {
            name: 'Java',
            title: 'Multi-threaded Chat Server',
            desc: 'Real-time messaging using sockets.',
            beginner: `import java.io.*;
import java.net.*;

public class SimpleServer {
    public static void main(String[] args) 
            throws IOException {
        ServerSocket server = 
            new ServerSocket(5000);
        System.out.println("Server started...");
        
        Socket client = server.accept();
        System.out.println("Client connected");
        
        client.close();
        server.close();
    }
}`,
            advanced: `import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

public class ChatServer {
    private ServerSocket serverSocket;
    private ExecutorService executor;
    private List<ClientHandler> clients;
    
    public ChatServer(int port) throws IOException {
        this.serverSocket = new ServerSocket(port);
        this.executor = Executors.newFixedThreadPool(10);
        this.clients = new CopyOnWriteArrayList<>();
    }
    
    public void start() {
        System.out.println("Chat server started on port 5000");
        while (true) {
            try {
                Socket socket = serverSocket.accept();
                ClientHandler handler = 
                    new ClientHandler(socket, this);
                clients.add(handler);
                executor.execute(handler);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    public void broadcast(String message, 
            ClientHandler sender) {
        for (ClientHandler client : clients) {
            if (client != sender) {
                client.sendMessage(message);
            }
        }
    }
    
    public static void main(String[] args) 
            throws IOException {
        ChatServer server = new ChatServer(5000);
        server.start();
    }
}`,
        }
    ],
    csharp: [
        {
            name: 'C#',
            title: 'Simple Game Loop',
            desc: 'Create immersive games.',
            beginner: `class Player {
    public string Name { get; set; }
    public int Health { get; set; }
    
    public Player(string name) {
        Name = name;
        Health = 100;
    }
    
    public void TakeDamage(int damage) {
        Health -= damage;
    }
}`,
            advanced: `using UnityEngine;
using System.Collections.Generic;

public class PlayerController : MonoBehaviour {
    [SerializeField] private float speed = 10f;
    [SerializeField] private float jumpForce = 5f;
    [SerializeField] private float groundDrag = 5f;
    [SerializeField] private float airDrag = 2f;
    
    private Rigidbody rb;
    private bool isGrounded;
    private float horizontalInput;
    private float verticalInput;
    
    private void Start() {
        rb = GetComponent<Rigidbody>();
    }
    
    private void Update() {
        horizontalInput = Input.GetAxis("Horizontal");
        verticalInput = Input.GetAxis("Vertical");
        
        isGrounded = Physics.Raycast(
            transform.position,
            Vector3.down,
            0.5f
        );
        
        ApplyDrag();
        HandleMovement();
        
        if (Input.GetKeyDown(KeyCode.Space) && isGrounded) {
            Jump();
        }
    }
    
    private void HandleMovement() {
        Vector3 moveDir = 
            (transform.forward * verticalInput +
             transform.right * horizontalInput).normalized;
        
        rb.AddForce(moveDir * speed * 10f, ForceMode.Force);
        
        Vector3 flatVel = 
            new Vector3(rb.velocity.x, 0f, rb.velocity.z);
        
        if (flatVel.magnitude > speed) {
            Vector3 limitedVel = flatVel.normalized * speed;
            rb.velocity = 
                new Vector3(
                    limitedVel.x,
                    rb.velocity.y,
                    limitedVel.z
                );
        }
    }
    
    private void ApplyDrag() {
        rb.drag = isGrounded ? groundDrag : airDrag;
    }
    
    private void Jump() {
        rb.velocity = 
            new Vector3(rb.velocity.x, 0f, rb.velocity.z);
        rb.AddForce(
            transform.up * jumpForce,
            ForceMode.Impulse
        );
    }
}`,
        },
        {
            name: 'C#',
            title: 'WPF Desktop Application',
            desc: 'Build modern desktop applications.',
            beginner: `using System.Windows;

public partial class MainWindow : Window {
    public MainWindow() {
        InitializeComponent();
        Title = "My First App";
    }
}`,
            advanced: `using System;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;

public partial class MainWindow : Window {
    private ObservableCollection<TodoItem> todos;
    
    public MainWindow() {
        InitializeComponent();
        todos = new ObservableCollection<TodoItem>();
        this.Loaded += MainWindow_Loaded;
    }
    
    private void MainWindow_Loaded(object sender, 
            RoutedEventArgs e) {
        TodoListBox.ItemsSource = todos;
    }
    
    private void AddButton_Click(object sender, 
            RoutedEventArgs e) {
        if (!string.IsNullOrWhiteSpace(InputBox.Text)) {
            var item = new TodoItem {
                Title = InputBox.Text,
                CreatedAt = DateTime.Now,
                IsCompleted = false
            };
            todos.Add(item);
            InputBox.Clear();
        }
    }
    
    private void DeleteButton_Click(object sender, 
            RoutedEventArgs e) {
        if (TodoListBox.SelectedItem is TodoItem item) {
            todos.Remove(item);
        }
    }
}

public class TodoItem {
    public string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCompleted { get; set; }
}`,
        }
    ],
    rust: [
        {
            name: 'Rust',
            title: 'File Indexer CLI',
            desc: 'Blazing fast CLI tool.',
            beginner: `use std::fs;

fn main() {
    let path = ".";
    
    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(e) = entry {
                    println!("{:?}", e.path());
                }
            }
        }
        Err(e) => println!("Error: {}", e),
    }
}`,
            advanced: `use std::fs;
use std::path::{Path, PathBuf};
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct FileInfo {
    path: PathBuf,
    size: u64,
    extension: String,
}

struct FileIndexer {
    files: Vec<FileInfo>,
    index: HashMap<String, Vec<PathBuf>>,
}

impl FileIndexer {
    fn new() -> Self {
        FileIndexer {
            files: Vec::new(),
            index: HashMap::new(),
        }
    }
    
    fn scan_directory(&mut self, dir: &Path) 
            -> Result<(), std::io::Error> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() {
                let metadata = fs::metadata(&path)?;
                let ext = path
                    .extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                
                let file_info = FileInfo {
                    path: path.clone(),
                    size: metadata.len(),
                    extension: ext.clone(),
                };
                
                self.index
                    .entry(ext)
                    .or_insert_with(Vec::new)
                    .push(path);
                
                self.files.push(file_info);
            } else if path.is_dir() {
                let _ = self.scan_directory(&path);
            }
        }
        Ok(())
    }
    
    fn get_stats(&self) -> (usize, u64) {
        let count = self.files.len();
        let total_size: u64 = 
            self.files.iter().map(|f| f.size).sum();
        (count, total_size)
    }
}

fn main() -> Result<(), std::io::Error> {
    let mut indexer = FileIndexer::new();
    indexer.scan_directory(Path::new("."))?;
    
    let (count, size) = indexer.get_stats();
    println!("Found {} files, {} bytes", count, size);
    
    Ok(())
}`,
        },
        {
            name: 'Rust',
            title: 'Async Web Server',
            desc: 'Async HTTP server.',
            beginner: `use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080")
        .expect("Failed to bind");
    
    println!("Listening on port 8080");
    
    for stream in listener.incoming() {
        match stream {
            Ok(_socket) => {
                println!("Client connected");
            }
            Err(e) => println!("Error: {}", e),
        }
    }
}`,
            advanced: `use std::net::TcpListener;
use std::io::{Read, Write};
use std::thread;

fn handle_client(mut stream: std::net::TcpStream) {
    let mut buffer = [0; 1024];
    
    if let Ok(n) = stream.read(&mut buffer) {
        let request = String::from_utf8_lossy(&buffer[..n]);
        
        if request.starts_with("GET") {
            let response = 
                "HTTP/1.1 200 OK\\r\\n\
                 Content-Type: text/html\\r\\n\
                 \\r\\n\
                 <h1>Hello from Rust!</h1>";
            
            let _ = stream.write_all(response.as_bytes());
        }
    }
}

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080")
        .expect("Failed to bind port 8080");
    
    println!("Server running on http://127.0.0.1:8080");
    
    for stream in listener.incoming() {
        match stream {
            Ok(socket) => {
                thread::spawn(|| {
                    handle_client(socket);
                });
            }
            Err(e) => eprintln!("Connection failed: {}", e),
        }
    }
}`,
        }
    ],
    html: [
        {
            name: 'HTML',
            title: 'Semantic Portfolio Website',
            desc: 'Semantic HTML5 with design.',
            beginner: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" 
        content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
</head>
<body>
    <header>
        <h1>Welcome</h1>
        <p>I'm a developer</p>
    </header>
    
    <nav>
        <a href="#home">Home</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
    </nav>
    
    <main>
        <section id="projects">
            <h2>My Projects</h2>
            <p>Check out my work here</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Portfolio</p>
    </footer>
</body>
</html>`,
            advanced: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" 
        content="width=device-width, initial-scale=1.0">
    <title>Advanced Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; }
        
        header { 
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }
        
        nav {
            background: #333;
            padding: 1rem;
            position: sticky;
            top: 0;
        }
        
        nav a {
            color: white;
            text-decoration: none;
            margin: 0 20px;
            transition: color 0.3s;
        }
        
        nav a:hover { color: #667eea; }
        
        .projects {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 40px;
        }
        
        .project-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .project-card:hover {
            transform: translateY(-5px);
        }
        
        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Advanced Portfolio</h1>
        <p>Modern web design with semantic HTML</p>
    </header>
    
    <nav>
        <a href="#home">Home</a>
        <a href="#projects">Projects</a>
        <a href="#skills">Skills</a>
        <a href="#contact">Contact</a>
    </nav>
    
    <main>
        <section id="projects">
            <div class="projects">
                <article class="project-card">
                    <h3>Project 1</h3>
                    <p>Description</p>
                    <a href="#">View Project</a>
                </article>
                <article class="project-card">
                    <h3>Project 2</h3>
                    <p>Description</p>
                    <a href="#">View Project</a>
                </article>
                <article class="project-card">
                    <h3>Project 3</h3>
                    <p>Description</p>
                    <a href="#">View Project</a>
                </article>
            </div>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Portfolio. All rights reserved.</p>
    </footer>
</body>
</html>`,
        },
        {
            name: 'HTML',
            title: 'E-Commerce Product Page',
            desc: 'Product showcase with styling.',
            beginner: `<!DOCTYPE html>
<html>
<head>
    <title>Shop</title>
</head>
<body>
    <h1>Products</h1>
    
    <div>
        <h2>Product 1</h2>
        <p>Price: $29.99</p>
        <button>Add to Cart</button>
    </div>
    
    <div>
        <h2>Product 2</h2>
        <p>Price: $39.99</p>
        <button>Add to Cart</button>
    </div>
    
    <div>
        <h2>Product 3</h2>
        <p>Price: $49.99</p>
        <button>Add to Cart</button>
    </div>
</body>
</html>`,
            advanced: `<!DOCTYPE html>
<html>
<head>
    <title>Modern Shop</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
        }
        
        .hero {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .hero p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .products {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 30px;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .product {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
        
        .product:hover {
            transform: translateY(-10px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .product-image {
            height: 200px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3em;
        }
        
        .product-info {
            padding: 20px;
        }
        
        .product h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .price {
            color: #667eea;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Modern Shop</h1>
        <p>Discover our exclusive collection</p>
    </div>
    
    <div class="products">
        <div class="product">
            <div class="product-image">👕</div>
            <div class="product-info">
                <h3>T-Shirt</h3>
                <p>Comfortable cotton t-shirt</p>
                <div class="price">$29.99</div>
                <button class="btn">Add to Cart</button>
            </div>
        </div>
        
        <div class="product">
            <div class="product-image">👖</div>
            <div class="product-info">
                <h3>Jeans</h3>
                <p>Classic blue jeans</p>
                <div class="price">$49.99</div>
                <button class="btn">Add to Cart</button>
            </div>
        </div>
        
        <div class="product">
            <div class="product-image">👟</div>
            <div class="product-info">
                <h3>Shoes</h3>
                <p>Premium sports shoes</p>
                <div class="price">$79.99</div>
                <button class="btn">Add to Cart</button>
            </div>
        </div>
    </div>
</body>
</html>`,
        }
    ]
};

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
        codeElement.innerText = data.beginner;
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
    
    const extensions = { python: 'py', js: 'js', cpp: 'cpp', java: 'java', csharp: 'cs', rust: 'rs', html: 'html' };
    const ext = extensions[lang] || 'txt';
    const filename = `${lang}-${data.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    
    const code = document.getElementById('code-display').innerText;
    const blob = new Blob([code], { type: 'text/plain' });
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