const React = require('react');
const ReactMarkupChecksum = require('./ReactMarkupChecksum');
const ReactServerUpdateQueue = require('./ReactServerUpdateQueue');
const emptyObject = {};
const escapeTextContentForBrowser = require('./escapeTextContentForBrowser');
const traverseAllChildren = require('./traverseAllChildren');

const {
  createMarkupForProperty,
  createMarkupForID,
  createMarkupForRoot
} = require('./DOMPropertyOperations');

const { createMarkupForStyles } = require('./CSSPropertyOperations');

const DOMProperty = require('./DOMProperty');
DOMProperty.injection.injectDOMPropertyConfig(require('./ARIADOMPropertyConfig'));
DOMProperty.injection.injectDOMPropertyConfig(require('./HTMLDOMPropertyConfig'));
DOMProperty.injection.injectDOMPropertyConfig(require('./SVGDOMPropertyConfig'));

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

const omittedCloseTags = {
  'area': true,
  'base': true,
  'br': true,
  'col': true,
  'embed': true,
  'hr': true,
  'img': true,
  'input': true,
  'keygen': true,
  'link': true,
  'meta': true,
  'param': true,
  'source': true,
  'track': true,
  'wbr': true,
};

function createOpenTagMarkup(type, props, id, isRootElement) {
  let out = `<${type}`;

  for (let propKey in props) {
    let propValue = props[propKey];
    if (propValue == null) {
      continue;
    }

    if (propKey === 'style') {
      propValue = createMarkupForStyles(propValue);
    }

    const markup = createMarkupForProperty(propKey, propValue);

    if (markup) {
      out += ` ${markup}`;
    }
  }

  if (isRootElement) {
    out += ` ${createMarkupForRoot()}`;
  }

  out += ` ${createMarkupForID(id)}`;

  return out;
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function resolve(child, context) {
  if (Array.isArray(child)) {
    throw new Error('well that was unexpected');
  }
  while (
    typeof child === 'object' &&
    React.isValidElement(child) &&
    typeof child.type === 'function'
  ) {
    const Component = child.type;
    // TODO: Mask context
    const publicContext = context;
    const updater = ReactServerUpdateQueue;
    if (shouldConstruct(Component)) {
      const inst = new Component(child.props, publicContext, updater);
      inst.props = child.props;
      inst.context = publicContext;
      inst.refs = emptyObject;
      inst.updater = updater;
      let initialState = inst.state;
      if (initialState === undefined) {
        inst.state = initialState = null;
      }
      if (inst.componentWillMount) {
        inst.componentWillMount();
        // TODO: setState in componentWillMount should work.
      }
      child = inst.render();
      const childContext = inst.getChildContext && inst.getChildContext();
      context = Object.assign({}, context, childContext);
    } else {
      child = Component(child.props, publicContext, updater);
    }
  }


  return {child, context};
}

function getNonChildrenInnerMarkup(props) {
  const innerHTML = props.dangerouslySetInnerHTML;
  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    const content = props.children;
    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextContentForBrowser(content);
    }
  }
  return null;
}

class ReactDOMServerRenderer {
  constructor(element) {
    this.stack = [{
      children: [element],
      childIndex: 0,
      context: emptyObject,
      footer: '',
    }];
    this.idCounter = 1;
    this.exhausted = false;
  }

  read(bytes) {
    let out = '';
    while (out.length < bytes) {
      if (this.stack.length === 0) {
        this.exhausted = true;
        break;
      }
      const frame = this.stack[this.stack.length - 1];
      if (frame.childIndex >= frame.children.length) {
        out += frame.footer;
        this.stack.pop();
        continue;
      }
      const child = frame.children[frame.childIndex++];
      const context = frame.context;

      if (typeof child === 'string' || typeof child === 'number') {
        out += (
          '<!-- react-text: ' + this.idCounter++ + ' -->' +
          escapeTextContentForBrowser('' + child) +
          '<!-- /react-text -->'
        );
      } else if (child === null || child === false) {
        out += '<!-- react-empty: ' + this.idCounter++ + ' -->';
      } else if (child === undefined) {
        throw new Error('Cannot render undefined')
      } else if (Array.isArray(child)) {
        // no need to push a new frame since context and footer is the same
        frame.children.push(...child);
      } else if (typeof child.type === 'string') {
        const tag = child.type.toLowerCase();
        let props = child.props;
        if (tag === 'input') {
          props = Object.assign({
            type: undefined,
          }, props);
        } else if (tag === 'textarea') {
          props = Object.assign({}, props, {
            value: undefined,
            children: props.value,
          });
        }
        const id = this.idCounter++;
        let html = createOpenTagMarkup(
          tag,
          props,
          id,
          id === 1
        );
        let footer = '';
        if (omittedCloseTags.hasOwnProperty(tag)) {
          html += '/>';
        } else {
          html += '>';
          footer = '</' + tag + '>';
        }

        const children = [];
        const innerMarkup = getNonChildrenInnerMarkup(props);
        if (innerMarkup != null) {
          html += innerMarkup;
        } else {
          traverseAllChildren(props.children, (ctx, child, name) => {
            if (child != null) {
              children.push(child);
            }
          });
        }
        // pushing new frame since footer may have changed
        this.stack.push({
          children: children,
          childIndex: 0,
          context: context,
          footer: footer,
        });
        out += html;
      } else if (typeof child.type === 'function') {
        const { child: newChild, context: newContext } = resolve(child, context);
        this.stack.push({
          children: [newChild],
          childIndex: 0,
          context: newContext,
          footer: '',
        });
      } else {
        console.log('cannot render', child)
        throw new Error('Cannot render child: ' + child);
      }
    }

    return out;
  }
}

const ReactDOMServerRendering = {
  renderToString: (element) => {
    const renderer = new ReactDOMServerRenderer(element);
    return ReactMarkupChecksum.addChecksumToMarkup(renderer.read(Infinity));
  },

  renderToStream: (element) => {
    const renderer = new ReactDOMServerRenderer(element);
    const { Readable, Transform } = require('stream');

    class Adler32 extends Transform {
      constructor() {
        super();
        this.out = '';
      }

      _transform(chunk, encoding, next) {
        this.out += chunk.toString("utf-8");
        this.push(chunk);
        next();
      }

      _flush(next) {
        const rootId = 1;
        const hash = ReactMarkupChecksum.checksum(this.out);
        const scriptId = `${rootId}.script`;
        this.push(
          `<script type="text/javascript" id="${scriptId}">
            document.querySelector('[data-reactid="${rootId}"]').setAttribute("data-react-checksum", ${hash});
            var s = document.getElementById("${scriptId}");
            s.parentElement.removeChild(s);
          </script>`
        );
        next();
      }
    }

    class Stream extends Readable {
      _read(bytes) {
        const data = renderer.read(bytes);
        this.push(data);
        if (data == null || data.length < bytes) {
          this.push(null);
        }
      }
    }

    const rs = new Stream;

    return rs.pipe(new Adler32);
  }
};

module.exports = ReactDOMServerRendering;
