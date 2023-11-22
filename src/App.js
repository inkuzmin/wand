import './App.css';

import React, { Component } from 'react';

import Algos from './algos';

class App extends Component {
  state = {
    image: null,
    tolerance: 10,
    undoStack: [],
    currentImageData: null,
  };

  canvasRef = React.createRef();

  getCanvasContext = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return ctx;
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.setState({ image: img }, this.drawImage);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  drawImage = () => {
    const ctx = this.getCanvasContext();
    const canvas = this.canvasRef.current;
    canvas.width = this.state.image.width;
    canvas.height = this.state.image.height;
    ctx.drawImage(this.state.image, 0, 0);

    this.saveState('render image');
  }

  saveState(actionName) {
    const ctx = this.getCanvasContext();
    const imageData = ctx.getImageData(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    this.setState(prevState => ({
      undoStack: [...prevState.undoStack, [actionName, imageData]],
      currentImageData: imageData,
    }));
  }

  undoToState = (index) => {
    const { undoStack } = this.state;
    const [_, imageData] = undoStack[index];
    const ctx = this.getCanvasContext();
    ctx.putImageData(imageData, 0, 0);
    this.setState({
      undoStack: undoStack.slice(0, index + 1),
      currentImageData: imageData,
    });
  }

  convertToGreyScale = () => {
    const ctx = this.getCanvasContext();
    const imageData = ctx.getImageData(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    const greyscaleImageData = Algos.convertToGreyscale(imageData);
    ctx.putImageData(greyscaleImageData, 0, 0);

    this.saveState('convert to greyscale');
  }

  magicWandSelect = (event) => {
    const ctx = this.getCanvasContext();
    const imageData = ctx.getImageData(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    const clickX = event.nativeEvent.offsetX;
    const clickY = event.nativeEvent.offsetY;
    const startPos = (clickY * imageData.width + clickX);

    const mask = Algos.floodFill(imageData, startPos, this.state.tolerance);

    let newImageData = Algos.applyMaskToImageData(imageData, mask, [255,0,0,255]);
    ctx.putImageData(newImageData, 0, 0);
    this.saveState('add magic wand mask');

    const cavitiesMask = Algos.cavitiesDetector(mask, imageData.width, imageData.height);
    newImageData = Algos.applyMaskToImageData(newImageData, cavitiesMask, [0,255,0,255]);
    ctx.putImageData(newImageData, 0, 0);
    this.saveState('add cavities mask');
  }

  render() {
    const { undoStack } = this.state;

    return (
        <div id="app">
          <div>
            <input type="file" onChange={this.handleFileChange} accept="image/*" />
          </div>
          <div>
            Tolerance:
            <input type="range" value={this.state.tolerance} onChange={(e) => this.setState({ tolerance: e.target.value })} min="0" max="100" />
            <input type="number" value={this.state.tolerance} onChange={(e) => this.setState({ tolerance: e.target.value })} min="0" max="100" />
          </div>
          <div>
            <button onClick={this.convertToGreyScale}>Greyscale</button>
          </div>

          <canvas ref={this.canvasRef} onClick={this.magicWandSelect} style={{ border: '1px dotted black' }} />

          {undoStack.length > 0 && <div>
            <h3>History</h3>
            <ul>
              {undoStack.map(([actionName], index) => (
                  <li key={index}>
                    {actionName}
                    [<span className="undo" onClick={() => this.undoToState(index)}>⎌</span>]
                  </li>
              ))}
            </ul>
          </div>}
        </div>
    );
  }
}

export default App;