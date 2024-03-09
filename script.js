if ("lastsave" == "" ) {
    console.log("ignore")
} else {
    var code = document.getElementById("codearea")
    code.textContent = localStorage.getItem("lastsave")
    localStorage.setItem("lastsave", "")
}

function saveFile() {
    var code = document.getElementById("codearea").value
    localStorage.setItem("lastsave", code)
    var blob = new Blob([code, {type: "text/plain;charset=utf-8"}])
    saveAs(blob, "main.blpd");

}

function runFile() {
    var code = document.getElementById("codearea").value
    localStorage.setItem("lastsave", code)
    eval(code)
}

function openFile() {

}

function pardCloud() {
    var code = document.getElementById("codearea").value
    localStorage.setItem("lastsave", code)
    var filename = window.prompt("Let's save it in the cloud! Enter the name of the file you want to save:")
    localStorage.setItem(filename, code)
    alert("The file was saved on Pardcloud. You can edit the file from Whitepard at any time.")
}

function pardcloudOpen() {
    var filename = window.prompt("Enter the name of the file in SwankyCloud. Make sure the name is correct and that you are at the same IP address that created the file.")
    var newcode = localStorage.getItem(filename)
    var code = document.getElementById("codearea")
    localStorage.setItem("lastsave", newcode)
    code.textContent = newcode;
}

