import React from 'react';
import './App.css';
import SVGInject from '@iconfu/svg-inject';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      file: null,
      fileData: null,
    };

    this.iframe = null;
    this.groupIndexMapping = {}; // { "api": [<rect />, <text />, ... ], "admin": [<rect />, <text />, ... ]}
    this.relationshipMapping = []; // [{ from: "prod_event_center", to: "prod_merchant_service"}]
    this.g = null; // the root element of svg

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.svgOnload = this.svgOnload.bind(this);
    this.svgOnclick = this.svgOnclick.bind(this);
  }

  onFormSubmit(e) {
    e.preventDefault() // Stop form submit
    var fr = new FileReader();
    fr.onload = () => {
      this.setState({ fileData: fr.result });
    };
    fr.readAsDataURL(this.state.file);
  }

  onChange(e) {
    this.setState({ file: e.target.files[0] })
  }

  async svgOnload() {
    await SVGInject(document.querySelectorAll("img.injectable")); // inject svg
    this.iframe = document.getElementById('plantuml');
    this.g = this.iframe.getElementsByTagName('g')[0];
    if (this.g === undefined) {
      return
    }

    for (let i = 0; i < this.g.children.length; i++) {
      this.g.children[i].onclick = this.svgOnclick;
    }

    const upper = this.g.innerHTML.split("@startuml")[0] // remove unused content
    let groups = upper.split(/<!--MD5=\[\w+\]\n(cluster|entity|link) ([\w ]+)-->/gm)
    groups.shift() // remove first empty string
    groups = groupArr(groups, 3)
    // start to parse group and tag element
    let elementIndex = 0;
    groups.forEach((group) => {
      if (group[0] === "link") {
        // is relationship
        const relationship = group[1].split(" to ") // relationship[0] is from, relationship[1] is to
        this.relationshipMapping.push({ from: relationship[0], to: relationship[1] })
      }
      this.groupIndexMapping[group[1]] = [];
      const elements = group[2].match(/<text\b[^>]*\/>|<polygon\b[^>]*>|<path\b[^>]*>|<rect\b[^>]*>|<text\b[^>]*>.*?<\/text>/gm)
      if (elements == null) {
        return
      }
      elements.forEach((element) => {
        this.g.children[elementIndex].setAttribute("group", group[1]); // tag element
        this.groupIndexMapping[group[1]].push(this.g.children[elementIndex]);
        elementIndex++;
      })
    })
  }

  svgOnclick(e) {
    const showElements = [];
    const target = e.toElement.getAttribute("group");
    this.relationshipMapping.forEach((relationship) => {
      if (relationship.to === target) {
        showElements.push(relationship.from);
      }
      if (relationship.from === target) {
        showElements.push(relationship.to);
      }
    })

    Object.keys(this.groupIndexMapping).forEach((key) => {
      if (!showElements.includes(key) && key !== target) {
        // not in show list
        this.groupIndexMapping[key].forEach((ele) => {
          ele.style.display = 'none';
        })
      }

      if (key.includes(target)) {
        this.groupIndexMapping[key].forEach((ele) => {
          ele.style.display = '';
        })
      }
    })
  }

  render() {
    return (
      <div className="App">
        <img style={{ display: 'block', width: '100%', height: 'auto' }} id="plantuml" src={this.state.fileData} className="injectable" onLoad={this.svgOnload} />
        <header className="App-header">
          <h1>Enable your plantuml svg to be interactive</h1>
          <form onSubmit={this.onFormSubmit}>
            <h1>File Upload</h1>
            <input type="file" onChange={this.onChange} />
            <button type="submit">Render</button>
          </form>
        </header>
      </div>
    );
  }
}

function groupArr(data, n) {
  var group = [];
  for (var i = 0, j = 0; i < data.length; i++) {
    if (i >= n && i % n === 0)
      j++;
    group[j] = group[j] || [];
    group[j].push(data[i])
  }
  return group;
}

export default App;
