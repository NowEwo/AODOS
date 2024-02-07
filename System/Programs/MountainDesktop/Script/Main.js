var ContextMenu = document.getElementById("ContextMenu");
var FileSystem = new FFS("EwOS");
var WindowsManager = document.querySelector("#WindowsManager");
var Kernel = parent;
var Workspace = 1;
var Software = {};
var Shell = this;

var DesktopConfiguration = JSON.parse(FileSystem.getFileContent("/bin/MountainDesktop/Config.conf").result);

function ToggleStartMenu() {
  document.getElementById("SecondMenu").style.display = "none";
  var StartMenu = document.getElementById("StartMenu");
  StartMenu.style.zIndex = "999999999";
  if (StartMenu.style.display == "none") {
    StartMenu.style.display = "block";
  } else {
    StartMenu.style.display = "none";
  }
  return true;
}

function ToggleSecondMenu() {
  document.getElementById("StartMenu").style.display = "none";
  var SecondMenu = document.getElementById("SecondMenu");
  SecondMenu.style.zIndex = "999999999";
  if (SecondMenu.style.display == "none") {
    SecondMenu.style.display = "block";
  } else {
    SecondMenu.style.display = "none";
  }
  return true;
}

function GenerateUniqueId() {
  let ID = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  return ID;
}

function ChangeWorkspace(Number) {
  console.info("Workspace Changed : " + Number + " !");
  var LastWorkspace = Shell.Workspace;
  Shell.Workspace = Number;
  ReloadTaskbar();
  ReloadWindows();
}

function CreateWindow(Data) {
  var UID = Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
  if (Data.Name == undefined) {
    var URL = Data.URL + "?" + Data.Arguments;
  } else {
    var URL = "/System/Programs/" + Data.Name + "/App.html?" + Data.Arguments;
  }
  Software[UID] = new WinBox({
    border: "0px",
    url: URL,
    title: Data.Title,
    x: "center",
    y: "center",
    bottom: "63px",
    root: WindowsManager,
    icon: "/System/Assets/Softwares/" + Data.Name + "/Icon.svg",
    id: UID,
    onclose: function () {
      delete Software[UID];
      ReloadTaskbar();
    },
    onminimize: function () {
      this.restore();
      this.hide();
      ReloadTaskbar();
    },
    onfocus: function () {
      ReloadTaskbar();
    },
    onblur: function () {
      ReloadTaskbar();
    },
  });
  if (Data.Icon != undefined) {
    Software[UID].setIcon(Data.Icon);
    Software[UID].Icon = Data.Icon;
  } else {
    Software[UID].Icon = "/System/Assets/Softwares/" + Data.Name + "/Icon.svg";
  }
  Software[UID].Workspace = Shell.Workspace;
  Software[UID].UID = UID;
  Software[UID].Controller = document
    .getElementById(UID)
    .querySelectorAll("iframe")[0].contentWindow;
  Software[UID].SetBlank = () => {
    Software[UID].Controller.document.location.href = "about:blank";
  };
  Software[UID].Controller.document.body.onload = function () {
    if (Data.Title == undefined) {
      Software[UID].setTitle(Software[UID].Controller.document.title);
    }
  };
  Software[UID].SetWorkspace = (Workspace) => {
    Software[UID].Workspace = Workspace;
    ReloadWindows();
    ReloadTaskbar();
  }
  Software[UID].EnableMenu = () => {
    Software[UID].addControl({
      index: 0,
      class: "wb-menu",
      click: function(event, winbox){
          Software[UID].Controller.ShellMenuEvent();
      }
    });
  }
  Software[UID].EnablePackage = () => {
    Software[UID].addControl({
      index: 0,
      class: "wb-package",
      click: function(event, winbox){
          Software[UID].Controller.ShellPackageEvent();
      }
    });
  }
  Software[UID].Controller.ContextWindow = Shell.Software[UID];
  Software[UID].Controller.Kernel = Kernel;
  Software[UID].Controller.Shell = Shell;
  Software[UID].SecondaryWindow = (WindowObject) => {
    WindowObject.addClass("no-close").addClass("no-min");
    Software[UID].onminimize = () => {
      WindowObject.minimize();
    };
    Software[UID].onrestore = () => {
      WindowObject.restore();
    };
  };
  Software[UID].ShowDialog = (Title, Text) => {
    Software[UID].Dialog = new WinBox({
      html: `<h1 style="color:white;text-align: center;width : 100%;">${Title}</h1><p style="color:white;text-align: center;width : 100%;">${Text}</p>`,
      modal: true
    });
  }
  if (Data.NoMenu == undefined) {
    ToggleStartMenu();
  }
  if (DesktopConfiguration.Shell.Mobile == true){
    Software[UID].g.querySelector(".wb-header").style.display = "none";
    Software[UID].maximize();
  }
  ReloadTaskbar();
  console.info(
    "New window : " +
    Data.Name +
    " as " +
    Data.Title +
    " ... Attributed Uid : " +
    UID
  );
  return Software[UID];
}

/*{
  "Name/URL" : ... ,    
  "Title" : ... ,
  "Icon" : ... ,
  "Arguments" : ...
}*/

function ShowDialog(Title, Text, Parent) {
  Parent.Dialog = new WinBox({
    html: `<h1 style="color:white;text-align: center;width : 100%;">${Title}</h1><p style="color:white;text-align: center;width : 100%;">${Text}</p>`,
    modal: true
  });
}

function ReloadWindows() {
  for (WindowObject in Software) {
    if (Software[WindowObject].Workspace != Shell.Workspace) {
      Software[WindowObject].g.style.visibility = "hidden";
    } else {
      Software[WindowObject].g.style.visibility = "visible";
    }
  }
}

function ReloadTaskbar() {
  Button = {};
  document.getElementById("TaskbarSoftwares").innerHTML = "";
  for (Process in Shell.Software) {
    Button[Process] = document.createElement("button");
    Button[Process].Process = Process;
    Button[Process].innerHTML =
      "<img src='" + Shell.Software[this.Process].Icon + "'>";
    Button[this.Process].setAttribute(
      "Minimized",
      new String(Shell.Software[this.Process].hidden)
    );
    Button[this.Process].setAttribute(
      "Focused",
      new String(Shell.Software[this.Process].focused)
    );
    Button[Process].addEventListener("click", function () {
      if (
        Shell.Software[this.Process].focused ||
        Shell.Software[this.Process].hidden
      ) {
        Shell.Software[this.Process].show(Shell.Software[this.Process].hidden);
        Button[this.Process].setAttribute(
          "Minimized",
          new String(Shell.Software[this.Process].hidden)
        );
      }
      Shell.Software[this.Process].focus();
      if (Shell.Software[this.Process].hidden) {
        Shell.Software[this.Process].blur();
        Button[this.Process].setAttribute(
          "Focused",
          new String(Shell.Software[this.Process].focused)
        );
      }
    });
    Button[Process].addEventListener("contextmenu", function (Event) {
      Event.preventDefault();
      Shell.Software[this.Process].close();
    });
    if (Shell.Software[this.Process].Workspace == Shell.Workspace) {
      document.getElementById("TaskbarSoftwares").appendChild(Button[Process]);
    }
    if(DesktopConfiguration.Style.Taskbar.CompactTaskbar == true){
      document.querySelector("#TaskbarSoftwares").querySelectorAll("button").forEach((Item) => {Item.querySelector("img").style.height = "19px";});
      document.querySelector("#TaskbarSoftwares").querySelectorAll("button").forEach((Item) => {Item.querySelector("img").style.width = "19px";});
      document.querySelector("#TaskbarSoftwares").querySelectorAll("button").forEach((Item) => {Item.style.width = "19px";Item.style.marginLeft = "5px";});
    }
  }
}

function SetContextMenuContent(Content) {
  ContextMenu.innerHTML = "";
  for (ContextButton in Content) {
    var Element = document.createElement("button");
    Element.className = "CtxMenuElement";
    Element.innerHTML = Content[ContextButton].Text;
    Element.addEventListener(
      "click",
      new Function(Content[ContextButton].Event)
    );
    ContextMenu.appendChild(Element);
  }
}

const circleElement = document.querySelector('.circle');

// Create objects to track mouse position and custom cursor position
const mouse = { x: 0, y: 0 }; // Track current mouse position
const previousMouse = { x: 0, y: 0 } // Store the previous mouse position
const circle = { x: 0, y: 0 }; // Track the circle position

// Initialize variables to track scaling and rotation
let currentScale = 0; // Track current scale value
let currentAngle = 0; // Track current angle value

// Update mouse position on the 'mousemove' event
window.addEventListener('mousemove', (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});

// Smoothing factor for cursor movement speed (0 = smoother, 1 = instant)
const speed = 0.51;

// Start animation
const tick = () => {
  // MOVE
  // Calculate circle movement based on mouse position and smoothing
  circle.x += (mouse.x - circle.x) * speed;
  circle.y += (mouse.y - circle.y) * speed;
  // Create a transformation string for cursor translation
  const translateTransform = `translate(${circle.x}px, ${circle.y}px)`;

  // SQUEEZE
  // 1. Calculate the change in mouse position (deltaMouse)
  const deltaMouseX = mouse.x - previousMouse.x;
  const deltaMouseY = mouse.y - previousMouse.y;
  // Update previous mouse position for the next frame
  previousMouse.x = mouse.x;
  previousMouse.y = mouse.y;
  // 2. Calculate mouse velocity using Pythagorean theorem and adjust speed
  const mouseVelocity = Math.min(Math.sqrt(deltaMouseX**2 + deltaMouseY**2) * 4, 150); 
  // 3. Convert mouse velocity to a value in the range [0, 0.5]
  const scaleValue = (mouseVelocity / 150) * 0.5;
  // 4. Smoothly update the current scale
  currentScale += (scaleValue - currentScale) * speed;
  // 5. Create a transformation string for scaling
  const scaleTransform = `scale(${1 + currentScale}, ${1 - currentScale})`;

  // ROTATE
  // 1. Calculate the angle using the atan2 function
  const angle = Math.atan2(deltaMouseY, deltaMouseX) * 180 / Math.PI;
  // 2. Check for a threshold to reduce shakiness at low mouse velocity
  if (mouseVelocity > 20) {
    currentAngle = angle;
  }
  // 3. Create a transformation string for rotation
  const rotateTransform = `rotate(${currentAngle}deg)`;

  // Apply all transformations to the circle element in a specific order: translate -> rotate -> scale
  circleElement.style.transform = `${translateTransform} ${rotateTransform} ${scaleTransform}`;

  // Request the next frame to continue the animation
  window.requestAnimationFrame(tick);
}

// Start the animation loop
tick();

document.addEventListener("mouseleave", function () {
  circleElement.style.display = "none";
});

document.addEventListener("mouseenter", function () {
  circleElement.style.display = "block";
});

/*
[
    {
        "Text" : "Example element !",
        "Event" : "parent.SetShell('EwOSDesktop');"
    },    
    {
        "Text" : "Other element !",
        "Event" : "parent.document.location.href='/';"
    }    
]    
*/

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (event.target.id != "Grab") {
    var ContextMenu = document.getElementById("ContextMenu");
    ContextMenu.style.left = event.clientX + "px";
    ContextMenu.style.top = event.clientY + "px";
    ContextMenu.style.display = "block";
  }
});

document.addEventListener("click", function (Event) {
  if (document.getElementById("ContextMenu").style.display == "block") {
    ContextMenu.style.display = "none";
  }
});

/*
for( Item in Softwares.keys()){
    document.getElementById("StartMenu").innerHTML = document.getElementById("StartMenu").innerHTML + `
    <div class="Tile" onclick="CreateWindow({'Title':${Item.Title},'URL':${Item.URL},'Icon':${Item.Icon}})">
        <p class="Title">${Item.Start.Title}</p>
        <p class="Subtitle">${Item.Start.Author}'s Software</p>
    </div>    
    `
}    
*/

function ShowNotification(Data) {
  notification_to_execute = Data.Event;
  document.getElementById("Notification").style.textAlign = "center";
  document.getElementById("NotificationTitle").style.fontWeight = "bold";
  document.getElementById("NotificationTitle").innerHTML = Data.Title;
  document.getElementById("NotificationMessage").style.fontWeight = "normal";
  document.getElementById("NotificationMessage").innerHTML = Data.Text;
  document.getElementById("Notification").style.display = "block";
  setTimeout(function () {
    document.getElementById("Notification").style.textAlign = "left";
    document.getElementById("Notification").style.display = "none";
  }, 5000);
}

function DropEvent(Data) {
  CreateWindow({
    URL: Data,
    Title: "",
    Icon: "",
  });
}

function Reload() {
  document.location.href = document.location.href;
}

document.getElementById("StartMenu").style.zIndex = "13";

document.getElementById("Grab").addEventListener("click", function () {
  for (ID in Software) {
    if (Software[ID].Workspace == Shell.Workspace) {
      if (!Software[ID].hidden) {
        Software[ID].hide();
        Button[ID].setAttribute(
          "Minimized",
          new String(Shell.Software[ID].hidden)
        );
      } else {
        Software[ID].show();
        Button[ID].setAttribute(
          "Minimized",
          new String(Shell.Software[ID].hidden)
        );
      }
    }
  }
});

document.getElementById("Grab").addEventListener("contextmenu", (Event) => {
  Event.preventDefault();
  for (ID in Software) {
    if (Software[ID].Workspace == Shell.Workspace) {
      Software[ID].close();
    }
  }
  ContextMenu.style.display = "none";
});

function BootScripts() {
  var OnBoot = FileSystem.getDirContent("/boot").result;
  for (Script in OnBoot) {
    Kernel.eval(FileSystem.getFileContent("/boot/" + OnBoot[Script].name).result);
    console.info(
      "The script on the path '/boot/" + OnBoot[Script].name + " is executed !"
    );
  }
}

function ReloadConfig() {
  if (FileSystem.fileExists("/etc/jsv.conf")) {
    var Config = JSON.parse(
      FileSystem.getFileContent("/etc/jsv.conf").result
    );
    for (Value in Config) {
      Kernel.eval(Value + " = `" + Config[Value] + "` ;");
    }
  }
}

document.querySelector("#Desktop").style.width = "100%";

function ReloadDesktop() {
  document.querySelector("#Desktop").innerHTML = ""
  for (ElementObject in FileSystem.getDirContent("/home/" + Kernel.User["Name"] + "/desktop").result) {
    var Button = document.createElement("button");
    var Name = FileSystem.getDirContent("/home/" + Kernel.User["Name"] + "/desktop").result[ElementObject].name
    var Content = FileSystem.getFileContent("/home/" + Kernel.User["Name"] + "/desktop" + ElementObject).result;
    Name = Name.replace(".link", "");
    Button.innerHTML = `
<p>${Name}</p>
    `
    Button.onclick = () => {
      if (FileSystem.getDirContent("/home/" + Kernel.User["Name"] + "/desktop").result[ElementObject].name.indexOf(".link") > -1) {
        Kernel.Process(FileSystem.getFileContent(FileSystem.getFullPath(FileSystem.getDirContent("/home/" + Kernel.User["Name"] + "/desktop").result[ElementObject])).result);
      } else {
        Kernel.Process("nano " + FileSystem.getFullPath(FileSystem.getDirContent("/home/" + Kernel.User["Name"] + "/desktop").result[ElementObject]));
      }
    }
    document.querySelector("#Desktop").appendChild(Button);
  }
}

function CreateDesktopLink(Name, Command) {
  FileSystem.writeFile("/home/" + Kernel.User["Name"] + "/desktop/" + Name + ".link", Command);
}

function ReloadStartMenu(){
  document.getElementById("MoreSoftwares").innerHTML = "";
  FileSystem.CWD("/bin/MountainDesktop/StartMenu");
  var FolderContent = FileSystem.getDirContent("/bin/MountainDesktop/StartMenu").result;
  for(Entry in FolderContent){
    var Entry = JSON.parse(FileSystem.getFileContent(FileSystem.getFullPath(FolderContent[Entry])).result)
    var StartMenuEntry = document.createElement("div");
    StartMenuEntry.PackageName = Entry.PackageName;
    StartMenuEntry.Description = Entry.Description;
    StartMenuEntry.Title = Entry.Name;
    StartMenuEntry.innerHTML = `
<div class="Tile">
    <p class="Title">${StartMenuEntry.Title}</p>
    <p class="Subtitle">${StartMenuEntry.Description}</p>
</div>
    `
    StartMenuEntry.onclick = () => {
      Kernel.Process(StartMenuEntry.PackageName);
    }
    document.getElementById("MoreSoftwares").appendChild(StartMenuEntry);
  }
  FileSystem.CWD("/")
}

ReloadStartMenu();
ReloadDesktop();
ReloadConfig();
BootScripts();

if(DesktopConfiguration.Style.Taskbar.TaskbarOnTop == true){
  document.querySelector("#Notification").style.bottom = "auto";
  document.querySelector("#Notification").style.top = "71px";
  document.querySelector("#StartMenu").style.bottom = "auto";
  document.querySelector("#StartMenu").style.top = "71px";
  document.querySelector(".Taskbar").style.top = "0px";
}

if(DesktopConfiguration.Style.Taskbar.CompactTaskbar == true){
  document.querySelector(".Taskbar").style.height = "25px";
  document.querySelector(".RightButtons").querySelectorAll("button").forEach((Item)=>{
    Item.style.height = "19px";
    Item.style.width = "19px";
  })
  document.querySelector(".StartButton").querySelector("svg").style.height = "19px";
  document.querySelector(".StartButton").querySelector("svg").style.width = "19px";
  document.querySelector("#WorkspaceNumber").style.height = "19px";
  document.querySelector("#WorkspaceNumber").style.width = "19px";
  document.querySelector(".StartButton").style.padding = "2.5px";
  document.querySelector(".StartButton").style.top = "0.19px";
  document.querySelector(".RightButtons").style.top = "1.9px";
  document.querySelector("#Notification").style.top = "35px";
  document.querySelector("#StartMenu").style.top = "35px";
  document.querySelector("#Grab").style.height = "19px";
  document.querySelector("#Grab").style.bottom = "3px";
}

if(DesktopConfiguration.Shell.Mobile == true){
  document.querySelector("#StartMenu").style.top = "9px";
  document.querySelector("#StartMenu").style.right = "9px";
  document.querySelector("#StartMenu").style.width = "auto";
  document.querySelector("#StartMenu").style.borderRadius = "0px";
  document.querySelector(".RightButtons").style.display = "none";
  document.querySelector("#Notification").style.left = "5px"; 
  document.querySelector("#Notification").style.top = "5px";
  document.querySelector("#Notification").style.bottom = "initial";
  window.scrollTo(0, 1);
}

Shell.document.title = Shell.document.location.href;