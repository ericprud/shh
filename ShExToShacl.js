class ShExToShacl {
  static Ns_shacl = 'http://www.w3.org/ns/shacl#';

  constructor (indent, out, prefixes, base) {
    this.indentation = indent;
    this.out = out;
    this.prefixes = prefixes;
    this.base = base;
  }

  convert (shexj) {
    const lead = '';
    this.renderPrefixes(lead, this.prefixes);
    this.out.write(`\n`);

    if (shexj.shapes) {
      const _ShExToShacl = this;
      shexj.shapes.forEach(decl => {
        if (decl.shapeExpr.type === 'Shape') {
          _ShExToShacl.out.write(`${lead}${_ShExToShacl.iri(decl.id)}`);
          _ShExToShacl.renderShapeExpression(lead, decl.shapeExpr);
          _ShExToShacl.out.write(`${lead}.\n\n`);
        } else {
          _ShExToShacl.out.write(`${lead}# ${decl.id} is not a simple Shape\n`);
        }
      });
    } else {
      this.out.write(`${lead}# no shapes declared in ShEx schema\n`);
    }
    this.out.end();
  }

  renderPrefixes (lead, prefixes) {
    let needsShaclNs = true;
    for (let [prefix, ns] of Object.entries(prefixes)) {
      this.out.write(`${lead}PREFIX ${prefix}: <${ns}>\n`);
      if (ns === ShExToShacl.Ns_shacl) {
        needsShapeNs = false;
      }
    }
    if (needsShaclNs) {
      let prefix = 'shacl';
      while (prefix in prefixes) {
        prefix += '_';
      }
      prefixes[prefix] = ShExToShacl.Ns_shacl;
      this.out.write(`${lead}PREFIX ${prefix}: <${ShExToShacl.Ns_shacl}>\n`);
    }
  }

  renderShapeExpression (lead, shapeExpr) {
    switch (shapeExpr.type) {
    case 'Shape':
      this.renderShape(lead, shapeExpr);
      break;
    case 'NodeConstraint':
      this.renderNodeConstraint(lead, shapeExpr);
      break;
    default:
      this.out.write(`${lead}# unknown ShapeExpression type ${shapeExpr.type}\n`);
    }
  }

  renderNodeConstraint (lead, nc) {
    if ('nodeKind' in nc)
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "nodeKind")} ${this.iri(ShExToShacl.Ns_shacl + nc.nodeKind.toUpperCase())} ;\n`);
    if ('datatype' in nc)
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "datatype")} ${this.iri(nc.datatype)} ;\n`);
    if ('values' in nc) {
      const values = nc.values.map(v => {
        if (typeof v === 'string') return this.iri(v);
        const langOrDt = 'language' in v
              ? `@${v.language}`
              : 'datatype' in v
              ? `^^${this.iri(v.datatype)}`
              : '';
        return `"${v.value}"${langOrDt}`;
      });
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "in")} (${values.join(' ')}) ;\n`);
    }
    if ('pattern' in nc) {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "pattern")} "${nc.pattern}" ;\n`);
      if ('flags' in nc) {
        this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "flags")} "${nc.flags}" ;\n`);
      }
    }
    const x2cl = {
      length: 'length',
      minlength: 'minLength',
      maxlength: 'maxLength',
      mininclusive: 'minInclusive',
      maxinclusive: 'maxInclusive',
      minexclusive: 'minExclusive',
      maxexclusive: 'maxExclusive',
    };
    for (let x in x2cl) {
      if (x in nc) {
        this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + x2cl[x])} "${nc[x]}" ;\n`);
      }
    }
    if ('totaldigits' in nc) {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "pattern")} "[0-9]{0,${nc.totaldigits}}\." ;\n`);
    }
    if ('fractiondigits' in nc) {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "pattern")} "\.[0-9]{0,${nc.totaldigits}}" ;\n`);
    }
  }

  renderShape (lead, sh) {
    lead = this.indent(lead);
    this.out.write(` a ${this.iri(ShExToShacl.Ns_shacl + "NodeShape")} ;\n`);
    if (sh.closed) {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "closed")} true;\n`);
    }
    const valueExpr = sh.expression;
    if (!valueExpr) {
      this.out.write(`${lead}# empty shape\n`);
    } else {
      this.renderTripleExpression(lead, valueExpr);
    }
    lead = this.outdent(lead);
  }

  renderTripleExpression (lead, tripleExpr) {
    switch (tripleExpr.type) {
    case 'TripleConstraint':
      this.renderTripleConstraint(lead, tripleExpr);
      break;
    case 'EachOf': {
      const _ShExToShacl = this;
      tripleExpr.expressions.forEach((conjunct, ord) => {
        if (conjunct.type === 'TripleConstraint') {
          _ShExToShacl.renderTripleConstraint(lead, conjunct);
        } else {
          _ShExToShacl.out.write(`${lead}# EachOf[${ord}] is not a TripleConstraint\n`);
        }
      });
      break;
    }
    case 'OneOf': {
          const typeIri = ShExToShacl.Ns_shacl + "OR";
          this.out.write(`${lead}${this.iri(typeIri)} (\n`);
          lead = this.indent(lead);
          const _ShExToShacl = this;
          tripleExpr.expressions.forEach((junct, ord) => {
            if (typeof junct === 'string') {
              _ShExToShacl.out.write(`${lead}${_ShExToShacl.iri(junct)}\n`);
            } else {
              _ShExToShacl.out.write(`${lead}[\n`);
              _ShExToShacl.renderTripleExpression(_ShExToShacl.indent(lead), junct);
              _ShExToShacl.out.write(`${lead}]\n`);
            }
          });
          lead = this.outdent(lead);
          this.out.write(`${lead}) ;\n`);
      break;
    }
    default:
      this.out.write(`${lead}# unknown TripleExpression type: ${tripleExpr.type}\n`);
    }
  }

  renderTripleConstraint (lead, tc) {
    this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "property")} [\n`);
    lead = this.indent(lead);
    this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "path")} ${this.iri(tc.predicate)} ;\n`);

    if ('min' in tc) {
      if (tc.min !== 0)
        this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "minCount")} ${tc.min} ;\n`);
    } else {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "minCount")} 1 ;\n`);
    }

    if ('max' in tc) {
      if (tc.max !== -1)
        this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "maxCount")} ${tc.max} ;\n`);
    } else {
      this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "maxCount")} 1 ;\n`);
    }

    if ('valueExpr' in tc) {
      // specialize renderShapeExpression(tc.valueExpr) to include shacl:node
      const valueExpr = tc.valueExpr;
      if (typeof valueExpr === 'string') {
        this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "node")} ${this.iri(valueExpr)} ;\n`);
      } else {
        switch (valueExpr.type) {
        case 'Shape':
          this.out.write(`${lead}${this.iri(ShExToShacl.Ns_shacl + "node")} `);
          this.renderShape(lead, valueExpr);
          break;
        case 'NodeConstraint':
          this.renderNodeConstraint(lead, valueExpr);
          break;
        case 'ShapeOr':
        case 'ShapeAnd':
          const typeIri = valueExpr.type === 'ShapeOr'
            ? ShExToShacl.Ns_shacl + "OR"
            : ShExToShacl.Ns_shacl + "AND";
          this.out.write(`${lead}${this.iri(typeIri)} (\n`);
          lead = this.indent(lead);
          const _ShExToShacl = this;
          valueExpr.shapeExprs.forEach((junct, ord) => {
            if (typeof junct === 'string') {
              _ShExToShacl.out.write(`${lead}${_ShExToShacl.iri(junct)}\n`);
            } else {
              _ShExToShacl.out.write(`${lead}[\n`);
              _ShExToShacl.renderShapeExpression(_ShExToShacl.indent(lead), junct);
              _ShExToShacl.out.write(`${lead}]\n`);
            }
          });
          lead = this.outdent(lead);
          this.out.write(`${lead}) ;\n`);
          break;
        default:
          this.out.write(`${lead}# unknown ShapeExpression type ${valueExpr.type}\n`);
        }
      }
    }

    lead = this.outdent(lead);
    this.out.write(`${lead}] ;\n`);
  }

  iri (i) {
    for (let [prefix, ns] of Object.entries(this.prefixes)) {
      if (i.startsWith(ns)) {
        return prefix + ':' + i.substr(ns.length);
      }
    }
    return `<${i}>`;
  }

  // Indentation
  indent (lead) {
    return lead + this.indentation;
  }
  outdent (lead) {
    return lead.substr(0, lead.length - this.indentation.length);
  }
}
