let ismdwn = 0
rpanrResize.addEventListener('mousedown', mD)

function mD(event) {
  ismdwn = 1
  document.body.addEventListener('mousemove', mV)
  document.body.addEventListener('mouseup', end)
}

function mV(event) {
  if (ismdwn === 1) {
    leftPanel.style.flexBasis = event.clientX + "px"
  } else {
    end()
  }
}

const end = (e) => {
  ismdwn = 0
  document.body.removeEventListener('mouseup', end)
  rpanrResize.removeEventListener('mousemove', mV)
}

var yashe = YASHE(document.getElementById('shexc'), {
  //Options
});

document.getElementById("l2r").addEventListener('click', foo);

function foo(event) {
  document.getElementById("shacl").textContent = yashe.getValue();
}
