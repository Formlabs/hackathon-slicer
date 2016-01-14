function upload(){
    let x = document.getElementById("upload");
    console.log(x.files);
}

document.getElementById("upload").onchange = upload;
