class ShaclToShEx {
  static Ns_shacl = 'http://www.w3.org/ns/shacl#';
  static Ns_rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  static Ns_xsd = 'http://www.w3.org/2001/XMLSchema#';

  constructor (indent, out, prefixes, base) {
    this.indentation = indent;
    this.out = out;
    this.prefixes = prefixes;
    this.base = base;
  }

  convert (graph) {
    this.graph = graph; // move to constructor or keep API like ShExToShacl?
    const lead = '';
    this.renderPrefixes(lead, this.prefixes);
    this.out.write(`\n`);

    const shapes = [... this.graph.match(null, ShaclToShEx.Ns_rdf + 'type', ShaclToShEx.Ns_shacl + 'NodeShape', null)];
    if (shapes.length > 0) {
      const _ShaclToShEx = this;
      shapes.forEach(decl => {
        _ShaclToShEx.out.write(`${lead}${_ShaclToShEx.iri(decl.subject.value)}`);
        _ShaclToShEx.renderNodeShape(lead, decl.subject);
        _ShaclToShEx.out.write(`\n\n`);
      });
    } else {
      this.out.write(`${lead}# no shapes declared in SHACL\n`);
    }
    this.out.end();
  }

  renderPrefixes (lead, prefixes) {
    for (let [prefix, ns] of Object.entries(prefixes)) {
      if (ns !== ShaclToShEx.Ns_shacl)
        this.out.write(`${lead}PREFIX ${prefix}: <${ns}>\n`);
    }
  }

  renderNodeShape (lead, shapeExpr) {
    this.renderShape(lead, shapeExpr);
  }

  renderNodeConstraint (lead, nc) {
    let separator = ' ';
    function sep () { const ret = separator; separator = ' AND '; return ret; }

    if (nc.termType === 'NamedNode') {
      this.out.write(`${sep()}@${this.iri(nc.value)}`);
      return 1; // !! early return
    }

    let count = 0;
    const nodeKind = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + "nodeKind");
    if (nodeKind) {
      ++count;
      this.out.write(`${sep()}${nodeKind.value.substr(ShaclToShEx.Ns_shacl.length).toUpperCase()}`)
    }
    const datatype = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + "datatype");
    if (datatype) {
      ++count;
      this.out.write(`${sep()}${this.iri(datatype.value)}`)
    }
    const pattern = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + "pattern");
    if (pattern) {
      ++count;
      let match;
      if ((match = pattern.match(/\[0-9\]\{0,([0-9]+)\}\\\./))) {
        this.out.write(`${sep()}TOTALDIGITS ${match[0]}`);
      } else if ((match = pattern.match(/\\\.\[0-9\]\{0,([0-9]+)\}/))) {
        this.out.write(`${sep()}FRACTIONDIGITS ${match[0]}`);
      } else {
        this.out.write(`${sep()}/${pattern.value}/`)
        const flags = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + "flags");
        if (flags) {
          this.out.write(`${flats.value}`)
        }
      }
    }
    const inList = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + "in");
    if (inList) {
      ++count;
      const values = this.list(inList);
      this.out.write(`${sep()} [`);
      values.forEach(v => {
        if (v.termType === 'NamedNode') {
          this.out.write(` ${this.iri(v.value)}`);
        } else {
          const langOrDt = v.language
                ? `@${v.language}`
                : v.datatype && v.datatype.value !== ShaclToShEx.Ns_xsd + 'string'
                ? `^^${this.iri(v.datatype.value)}`
                : '';
          this.out.write(` "${v.value}"${langOrDt}`);
        }
      });
      this.out.write(' ]');
    }
    const cl2x = {
      length: 'length',
      minlength: 'minLength',
      maxLength: 'maxlength',
      minInclusive: 'mininclusive',
      maxInclusive: 'maxinclusive',
      minExclusive: 'minexclusive',
      maxExclusive: 'maxexclusive',
    };
    for (let x in cl2x) {
      const y = this.zeroOrOne(nc, ShaclToShEx.Ns_shacl + x);
      if (y) {
        ++count;
        this.out.write(`${sep()}${x2cl[x]} ${y} ;\n`);
      }
    }
    return count;
  }

  renderShape (lead, sh) {
    lead = this.indent(lead);
    const closed = this.zeroOrOne(sh, ShaclToShEx.Ns_shacl + "closed");
    if (closed) {
      this.out.write(` CLOSED`);
    }
    this.out.write(` {\n`);
    this.renderShapeContents(lead, sh)
    lead = this.outdent(lead);
    this.out.write(`${lead}}\n`);
  }

  renderShapeContents (lead, sh) {
    const shapes = [... this.graph.match(sh, ShaclToShEx.Ns_shacl + 'property', null, null)];
    const and = this.zeroOrOne(sh, ShaclToShEx.Ns_shacl + "AND", null);
    const or = this.zeroOrOne(sh, ShaclToShEx.Ns_shacl + "OR", null);
    if (shapes.length !== 0) {
      const _ShaclToShEx = this;
      shapes.forEach((te, ord) => {
        _ShaclToShEx.renderTripleConstraint(lead, te.object, ord === shapes.length - 1 ? '' : ' ;');
      })
    } else if (and || or) {
      const juncts = this.list(and || or);
      const _ShaclToShEx = this;
      juncts.forEach((junct, ord) => {
        if (ord > 0)
          this.out.write(` ${and ? ';' : '|'}`);
        _ShaclToShEx.renderShapeContents(this.indent(lead), junct);
      });
    } else {
      this.out.write(`${lead}# empty shape\n`);
    }
  }

  renderTripleConstraint (lead, tc, terminator) {
    this.out.write(`${lead}${this.iri(this.one(tc, ShaclToShEx.Ns_shacl + "path").value)} `);
    lead = this.indent(lead);

    const minCount = parseInt(this.zeroOrOne(tc, ShaclToShEx.Ns_shacl + "minCount", {value:"0"}).value);
    const maxCount = parseInt(this.zeroOrOne(tc, ShaclToShEx.Ns_shacl + "maxCount", {value:"-1"}).value);
    const cardStr = minCount === 0
          ? maxCount === 1 ? ' ?' : maxCount === -1 ? ' *' : ` {${minCount}, ${maxCount}}`
          : minCount === 1
          ? maxCount === 1 ? '' : maxCount === -1 ? ' +' : ` {${minCount}, ${maxCount}}`
          : ` {${minCount}, ${maxCount}}`;

    const node = this.zeroOrOne(tc, ShaclToShEx.Ns_shacl + "node", null);
    const and = this.zeroOrOne(tc, ShaclToShEx.Ns_shacl + "AND", null);
    const or = this.zeroOrOne(tc, ShaclToShEx.Ns_shacl + "OR", null);
    let needsDot = true;
    if (node) {
      needsDot = false;
      this.renderNodeConstraint(this.indent(lead), node);
    } else if (and || or) {
      needsDot = false;
      const juncts = this.list(and || or);
      const _ShaclToShEx = this;
      juncts.forEach((junct, ord) => {
        if (ord > 0)
          this.out.write(` ${and ? 'AND' : 'OR'}`);
        this.renderNodeConstraint(this.indent(lead), junct);
      });
    }

    if (this.renderNodeConstraint(lead, tc) > 0)
      needsDot = false;

    if (needsDot) {
      this.out.write(`.`);
    }

    this.out.write(`${cardStr}${terminator}\n`);

    lead = this.outdent(lead);
  }

  renderNestedNode (lead, node) {
    if (node.termType === 'NamedNode') {
      this.out.write(` ${this.iri(node.value)}`);
    } else {
      this.out.write(` !! ${this.iri(node.value)}`);
    }
  }

  zeroOrOne (s, p, dflt = null) {
    const ones = [... this.graph.match(s, p, null, null)];
    if (ones.length > 1) {
      this.out.write(` # expected one match of ${this.iri(s.value)} ${this.iri(p.value)}, got ${ones.length}\n`);
    }
    return ones.length === 1
      ? ones[0].object
      : dflt;
  }

  one (s, p) {
    const ones = [... this.graph.match(s, p, null, null)];
    if (ones.length !== 1) {
      this.out.write(` # expected one match of ${this.iri(s.value)} ${this.iri(p.value)}, got ${ones.length}\n`);
    }
    return ones[0].object;
  }

  list (s) {
    const ret = [];
    while (s.value !== ShaclToShEx.Ns_rdf + 'nil') {
      ret.push(this.one(s, ShaclToShEx.Ns_rdf + 'first'));
      s = this.one(s, ShaclToShEx.Ns_rdf + 'rest');
    }
    return ret;
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
