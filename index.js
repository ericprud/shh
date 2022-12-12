Ns_shacl = 'http://www.w3.org/ns/shacl#';

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

const yashe = YASHE(document.getElementById('shexc'), {
  //Options
});

document.getElementById("l2r").addEventListener('click', copyL2R);
document.getElementById("r2l").addEventListener('click', copyR2L);


document.addEventListener('keydown', evt => {
  if (evt.ctrlKey && evt.altKey) {
    if (evt.code === 'ArrowRight')
      return copyL2R();
    if (evt.code === 'ArrowLeft')
      return copyR2L();
  }
  return true;
});

function copyL2R () {
  class TextAreaWriter {
    constructor (elt) {
      this.elt = elt;
    }
    write (text, encoding) {
      this.elt.value += text;
    }
    end () { }
  }

  shacl.value = ``;
  const out = new TextAreaWriter(shacl);
  const url = "" + window.location;
  const shexc = yashe.getValue();
  const shexParser = ShExWebApp.Parser.construct(url, null, {index:true});
  const shexj = shexParser.parse(shexc);
  const prefixes = shexj._prefixes;
  const base = shexj._base;
  prefixes['shacl'] = Ns_shacl;
  new ShExToShacl('  ', out, prefixes, base).convert(shexj);
  return false;
}

function copyR2L () {
  class CodeMirrorWriter {
    constructor (editor) {
      this.editor = editor;
    }
    write (text, encoding) {
      // this.editor.editor.replaceRange(text, CodeMirror.Pos(this.editor.lastLine()));
      this.editor.setValue(this.editor.getValue() + text); // inefficient
    }
    end () { }
  }

  // yashe.setValue('');
  const out = new CodeMirrorWriter(yashe);
  alert("not implemented");
  return false;
}

