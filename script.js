const users = [{ username: "Flickshot", password: "flickshot@123", storage: "unlimited" }];
let loggedInUser = null;
let filesAndFolders = { files: [], folders: {} };

// Show login page initially
document.getElementById("login-page").style.display = "block";
document.getElementById("app").style.display = "none";

// Handle login
document.getElementById("login-btn").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    loggedInUser = user;
    document.getElementById("login-page").style.display = "none";
    document.getElementById("app").style.display = "block";
    updateUI();
    loadFilesAndFolders();
  } else {
    alert("Invalid username or password");
  }
});

// Update UI for logged-in user
function updateUI() {
  document.getElementById("storage-info").textContent = loggedInUser.storage === "unlimited" ? "Unlimited Storage" : "4GB Limit";
}

// Handle file and folder uploads
document.getElementById("upload-files").addEventListener("click", () => {
  handleUpload("file-upload");
  handleUpload("folder-upload", true);
});

// Handle uploads
function handleUpload(inputId, isFolder = false) {
  const input = document.getElementById(inputId);
  const fileList = document.getElementById("file-list");

  Array.from(input.files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = function(event) {
      const base64Data = event.target.result;

      if (isFolder) {
        const folderName = file.webkitRelativePath.split("/")[0];
        if (!filesAndFolders.folders[folderName]) {
          filesAndFolders.folders[folderName] = [];
        }
        filesAndFolders.folders[folderName].push({ name: file.name, base64: base64Data });
      } else {
        filesAndFolders.files.push({ name: file.name, base64: base64Data });
      }

      saveFilesAndFolders();
      renderFilesAndFolders();
    };

    reader.readAsDataURL(file);  // Read file as base64
  });
}

// Render files and folders
function renderFilesAndFolders() {
  const fileList = document.getElementById("file-list");
  fileList.innerHTML = "";

  // Render files
  filesAndFolders.files.forEach((file, index) => {
    const card = createFileCard(file.name, file.base64, index);
    fileList.appendChild(card);
  });

  // Render folders
  Object.keys(filesAndFolders.folders).forEach((folderName) => {
    const folderCard = createFolderCard(folderName);
    fileList.appendChild(folderCard);
  });
}

// Create a file card
function createFileCard(name, base64, index) {
  const card = document.createElement("div");
  card.classList.add("file-card");

  const img = document.createElement("img");
  img.src = base64;  // Use base64 as the image source
  img.alt = name;

  const downloadBtn = createButton("Download", () => downloadFile(name, base64));
  const shareBtn = createButton("Share", () => alert(`Shareable link: ${base64}`));
  const removeBtn = createButton("Remove", () => removeFile(index));

  card.append(img, downloadBtn, shareBtn, removeBtn);
  return card;
}

// Create a folder card
function createFolderCard(folderName) {
  const card = document.createElement("div");
  card.classList.add("folder-card");

  const folderIcon = document.createElement("div");
  folderIcon.textContent = "📁";
  folderIcon.classList.add("folder-icon");

  const folderNameEl = document.createElement("div");
  folderNameEl.textContent = folderName;

  const viewBtn = createButton("View", () => viewFolder(folderName));
  const downloadBtn = createButton("Download", () => downloadFolder(folderName));
  const shareBtn = createButton("Share", () => alert(`Shareable link: ${window.location.href}/${folderName}`));
  const removeBtn = createButton("Remove", () => removeFolder(folderName));

  card.append(folderIcon, folderNameEl, viewBtn, downloadBtn, shareBtn, removeBtn);
  return card;
}

// Create a button
function createButton(text, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  return btn;
}

// View folder contents
function viewFolder(folderName) {
  const folder = filesAndFolders.folders[folderName];
  const folderImages = document.getElementById("folder-images");
  folderImages.innerHTML = "";

  folder.forEach((file) => {
    const img = document.createElement("img");
    img.src = file.base64;  // Use base64 as the image source
    img.alt = file.name;
    img.style.width = "150px";
    img.addEventListener("click", () => openFullScreen(img.src));
    folderImages.appendChild(img);
  });

  document.getElementById("file-list").style.display = "none";
  document.getElementById("folder-content").style.display = "block";
}

// Remove file
function removeFile(index) {
  filesAndFolders.files.splice(index, 1);
  saveFilesAndFolders();
  renderFilesAndFolders();
}

// Remove folder
function removeFolder(folderName) {
  delete filesAndFolders.folders[folderName];
  saveFilesAndFolders();
  renderFilesAndFolders();
}

// Back to file list
document.getElementById("back-btn").addEventListener("click", () => {
  document.getElementById("folder-content").style.display = "none";
  document.getElementById("file-list").style.display = "block";
});

// Open image in full screen
function openFullScreen(src) {
  const modal = document.getElementById("fullscreen-modal");
  const fullImg = document.getElementById("fullscreen-img");
  fullImg.src = src;
  modal.style.display = "flex";
}

// Close the modal
document.getElementById("fullscreen-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("fullscreen-modal") || e.target.id === "close-btn") {
    document.getElementById("fullscreen-modal").style.display = "none";
  }
});

// Save files and folders to localStorage
function saveFilesAndFolders() {
  localStorage.setItem("filesAndFolders", JSON.stringify(filesAndFolders));
}

// Load saved files and folders from localStorage
function loadFilesAndFolders() {
  const savedData = localStorage.getItem("filesAndFolders");
  if (savedData) {
    filesAndFolders = JSON.parse(savedData);
    renderFilesAndFolders();
  }
}

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", () => {
  loggedInUser = null; // Clear logged-in user
  filesAndFolders = { files: [], folders: {} }; // Clear uploaded data
  localStorage.removeItem("filesAndFolders"); // Remove the saved data

  alert("You have logged out. Your data is cleared.");
  document.getElementById("login-page").style.display = "block";
  document.getElementById("app").style.display = "none";
});

// Add the downloadFolder function to allow downloading of entire folders
function downloadFolder(folderName) {
  const folder = filesAndFolders.folders[folderName];
  const zip = new JSZip(); // Assuming you have JSZip included in your project

  // Add files from the folder to the zip
  folder.forEach((file) => {
    zip.file(file.name, file.base64.split(",")[1], { base64: true });  // Assuming URL is a base64 data URL
  });

  // Generate the zip file and trigger the download
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(content);
    a.href = url;
    a.download = folderName + ".zip";  // Set the folder name as the zip file name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
