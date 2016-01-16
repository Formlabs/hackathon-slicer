'use strict';

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

function disableButtons()
{
    document.getElementById("slice").disabled = true;
    document.getElementById("upload").disabled = true;
    document.getElementById("rot_reset").disabled = true;
}

function enableButtons()
{
    document.getElementById("slice").disabled = false;
    document.getElementById("upload").disabled = false;
    document.getElementById("rot_reset").disabled = false;
}

function setStatus(txt)
{
    document.getElementById("status").innerHTML = txt;
}

module.exports = {'disableButtons': disableButtons,
                  'enableButtons': enableButtons,
                  'setStatus': setStatus};
