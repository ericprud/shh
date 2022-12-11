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
  const url = "" + window.location;
  const shexc = yashe.getValue();
  const shexParser = ShExWebApp.Parser.construct(url, null, {index:true});
  const shexj = shexParser.parse(shexc);
  const prefixes = shexj._prefixes;
  const base = shexj._base;
  prefixes['shacl'] = Ns_shacl;

  shacl.value = ``;
  renderPrefixes(prefixes);
  shacl.value += `\n`;

  if (shexj.shapes) {
    shexj.shapes.forEach(decl => {
      if (decl.shapeExpr.type === 'Shape') {
        shacl.value += `${lead}${iri(decl.id)}`;
        renderShape(lead, decl.shapeExpr);
        shacl.value += `${lead}.\n\n`;
      } else {
        shacl.value += `${lead}# ${decl.id} is not a simple Shape\n`;
      }
    });
  } else {
    shacl.value += `${lead}# no shapes declared in ShExC\n`;
  }

  function renderPrefixes (prefixes) {
    for (let [prefix, ns] of Object.entries(prefixes)) {
      shacl.value += `PREFIX ${prefix}: <${ns}>\n`;
    }
  }

  function renderShape (lead, sh) {
    shacl.value += ` a ${iri(Ns_shacl + "NodeShape")}\n`;
    // lead = ind(lead);
    const valueExpr = sh.expression;
    if (!valueExpr) {
      shacl.value += `${lead}# ${decl.id} is an empty shape\n`;
    } else {
      renderTripleExpr(lead, valueExpr);
    }
    // lead = out(lead);
  }

  function renderTripleExpr (lead, tripleExpr) {
    if (tripleExpr.type === 'TripleConstraint') {
      renderTC(tripleExpr, ind(lead));
    } else if (tripleExpr.type === 'EachOf') {
      tripleExpr.expressions.forEach((conjunct, ord) => {
        if (conjunct.type === 'TripleConstraint') {
          renderTC(conjunct, ind(lead));
        } else {
          shacl.value += `${lead}# EachOf[${ord}] is not a TripleConstraint\n`;
        }
      });
    } else {
      shacl.value += `${lead}# can only convert EachOfs or TripleConstraints\n`;
    }
  }

  function renderTC (tc, lead) {
    shacl.value += `${lead}${iri(Ns_shacl + "property")} [\n`;
    lead = ind(lead);
    shacl.value += `${lead}${iri(Ns_shacl + "path")} ${iri(tc.predicate)} ;\n`;
    if ('min' in tc) {
      if (tc.min !== 0)
        shacl.value += `${lead}${iri(Ns_shacl + "minCount")} ${tc.min} ;\n`;
    } else {
      shacl.value += `${lead}${iri(Ns_shacl + "minCount")} 1 ;\n`;
    }
    if ('max' in tc) {
      if (tc.max !== -1)
        shacl.value += `${lead}${iri(Ns_shacl + "maxCount")} ${tc.max} ;\n`;
    } else {
      shacl.value += `${lead}${iri(Ns_shacl + "maxCount")} 1 ;\n`;
    }
    lead = out(lead);
    shacl.value += `${lead}] ;\n`;
  }

  function iri (i) {
    for (let [prefix, ns] of Object.entries(prefixes)) {
      if (i.startsWith(ns)) {
        return prefix + ':' + i.substr(ns.length);
      }
    }
    return `<${i}>`;
  }
  
  function ind (lead) {
    return lead + indent
  }

  function out (lead) {
    return lead.substr(0, lead.length - indent.length);
  }
}
