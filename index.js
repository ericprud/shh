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

document.getElementById("l2r").addEventListener('click', evt => {
  copyL2R('  ');
  return false;
});
document.addEventListener('keydown', evt => {
  if (evt.ctrlKey && evt.altKey && evt.code === 'ArrowRight') {
    copyL2R('  ');
    return false;
  }
  return true;
});

document.getElementById("r2l").addEventListener('click', evt => {
  copyR2L('  ');
  return false;
});
document.addEventListener('keydown', evt => {
  if (evt.ctrlKey && evt.altKey && evt.code === 'ArrowLeft') {
    copyR2L('  ');
    return false;
  }
  return true;
});

function copyR2L (indent) {
  alert("not implemented");
}

function copyL2R (indent) {
  let lead = '';
  const shexc = yashe.getValue();
  const shexParser = ShExWebApp.Parser.construct();
  const shexj = shexParser.parse(shexc);
  shacl.value = `PREFIX sh: <http://www.w3.org/ns/shacl#>\n\n `;
  if (shexj.shapes) {
    shexj.shapes.forEach(decl => {
      if (decl.shapeExpr.type === 'Shape') {
        shacl.value += `${lead}${ttl(decl.id)} a sh:NodeShape\n`;
        // lead = ind(lead);
        const sh = decl.shapeExpr;
        const valueExpr = sh.expression;
        if (!valueExpr) {
          shacl.value += `${lead}# ${decl.id} is an empty shape\n`;
        } else if (valueExpr.type === 'TripleConstraint') {
          renderTC(valueExpr, ind(lead));
        } else if (valueExpr.type === 'EachOf') {
          valueExpr.expressions.forEach((conjunct, ord) => {
            if (conjunct.type === 'TripleConstraint') {
              renderTC(conjunct, ind(lead));
            } else {
              shacl.value += `${lead}# EachOf[${ord}] is not a TripleConstraint\n`;
            }
          });
        } else {
          shacl.value += `${lead}# ${decl.id} doesn't have an EachOf or TC\n`;
        }
        // lead = out(lead);
        shacl.value += `${lead}.\n\n`;
      } else {
        shacl.value += `${lead}# ${decl.id} is not a simple Shape\n`;
      }
    });
  } else {
    shacl.value += `${lead}# no shapes declared in ShExC\n`;
  }

  function renderTC (tc, lead) {
    shacl.value += `${lead}sh:property [\n`;
    lead = ind(lead);
    shacl.value += `${lead}sh:path ${ttl(tc.predicate)} ;\n`;
    if ('min' in tc) {
      if (tc.min !== 0)
        shacl.value += `${lead}sh:minCount ${tc.min} ;\n`;
    } else {
      shacl.value += `${lead}sh:minCount 1 ;\n`;
    }
    if ('max' in tc) {
      if (tc.max !== -1)
        shacl.value += `${lead}sh:maxCount ${tc.max} ;\n`;
    } else {
      shacl.value += `${lead}sh:maxCount 1 ;\n`;
    }
    lead = out(lead);
    shacl.value += `${lead}] ;\n`;
  }

  function ttl (i) {
    return `<${i}>`;
  }
  
  function ind (lead) {
    return lead + indent
  }

  function out (lead) {
    return lead.substr(0, lead.length - indent.length);
  }
}
