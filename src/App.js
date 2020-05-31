import React from 'react';
import './App.css';
import githubIcon from './img/github-w.png';
import arrowDown from './img/arrow-down.gif';
import SVGInject from '@iconfu/svg-inject';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      file: null,
      fileData: null,
      showWarning: false,
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

  componentDidMount() { // make file input custom
    bsCustomFileInput.init();
  }

  toggleWarning(show) {
    if (show !== undefined) {
      return this.setState({ showWarning: show })
    }
    return this.setState({ showWarning: !this.state.showWarning})
  }

  onFormSubmit(e) {
    e.preventDefault() // Stop form submit
    if (this.state.file == null) {
      this.toggleWarning(true);
      return
    }

    const fr = new FileReader();
    fr.onload = () => {
      this.setState({ fileData: fr.result });
    };
    fr.readAsDataURL(this.state.file);
  }

  onChange(e) {
    this.setState({ file: e.target.files[0] })
    this.toggleWarning(false);
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

    window.scrollTo(0, 0); // scroll to top
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
        <img alt="" style={{ display: 'block', width: '100%', height: 'auto' }} id="plantuml" src={this.state.fileData} className="injectable" onLoad={this.svgOnload} />
        <header className="App-header">
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/Willis0826/interactive-plantuml">
            <img alt="" src={githubIcon} className="fix-upper-right"/>
          </a>
          <Container>
            <div className="full-view">
              <h1>Enable your PlantUML svg to be interactive</h1>
              <Form onSubmit={this.onFormSubmit}>
                <Form.Row className="d-flex justify-content-center">
                  <Form.Group>
                    <Form.File
                      onChange={this.onChange}
                      id="custom-file"
                      label="Drag or select your *.svg"
                      custom
                    />
                    {
                      this.state.showWarning?
                      <Form.Text className="text-warning-light">
                        Please select one *.svg you want
                      </Form.Text>:null
                    }
                  </Form.Group>
                </Form.Row>
                <Button size="lg" type="submit" variant="info">Render</Button>
              </Form>

              <a href="#section2">
                <span className="text-info know-more-link">
                  know more
                  <img style={{width: '50px'}} src={arrowDown} />
                </span>
              </a>
            </div>
            <hr className="solid-white-border"/>
            <Row>
              <Col>
                <h2 id="section2">How it works?</h2>
                <ol>
                  <li>
                    You can transform your PlantUML into svg and download it with
                    <a rel="noopener noreferrer" target="_blank" href="https://www.planttext.com/"> planttext</a>
                  </li>
                  <li>
                    Let the site analyze your svg and make it interactable. The most important is, all happend in browser no content will be transfer thought network.
                  </li>
                </ol>
              </Col>
            </Row>
          </Container>
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
