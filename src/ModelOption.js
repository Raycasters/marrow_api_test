import React, { Component } from 'react';
import io from 'socket.io-client';
import { withContext } from './Provider';
import './styles/ModelOption.scss'

class ModelOption extends Component {
  state = {
    socket: null,
    inputText: '',
    loop: false
  }

  handleInputChange = (e) => {
    const { emit } = this.props;

    const inputText = e.target.value;
    if (this.state.socket) {
      this.setState({ inputText }, () => {
        this.state.socket.emit(emit, {
          caption: inputText
        });
      })
    }
  }
  
  connect() {
    const { url, name, context, emit, listen } = this.props;
    if (name == 'AttnGAN') {
        this.setState({ socket: io(url) }, () => {
          this.state.socket.on('connect', () => {
            console.log('connected to', name)
          });
          this.state.socket.on(listen, (data) => {
            if (name === 'AttnGAN') {
              context.setAttnGANImg("data:image/jpg;base64," + data.image)
            } else {
              const canvas = document.getElementById('resultCanvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 340, 240);
                if (this.state.loop) {
                  this.state.socket.emit(emit, {
                    data: document.getElementById('videoCanvas').toDataURL('image/jpeg')
                  });
                }
              };
              img.src = "data:image/jpg;base64," + data.results;
            }
          });
        })
    }
  }

  handleStart(loop) {
    const { socket  } = this.state;
    const { context, emit, url, name  } = this.props;
    context.setShowResultCanvas(loop);
    console.log("Start", loop);

    this.setState({ loop }, () => {
        if (loop) {
            this.fetch();
        }
    })
  }

  fetch() {
    const { socket, loop  } = this.state;
    const { context, emit, url, name  } = this.props;
    if (socket && name === 'AttnGAN') {
        console.log('will emit to', emit)
    } else {
        console.log("Fetching");
        fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                //'Content-Type': 'application/x-www-form-urlencoded',
            },
            body : JSON.stringify({
                data: document.getElementById('videoCanvas').toDataURL('image/jpeg')
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log("Data response!", data);
            const canvas = document.getElementById('resultCanvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, 340, 240);
            };
            img.src = "data:image/jpg;base64," + data.results;

            if (loop) {
                this.fetch(loop);
            }
        })
    }

  }

  render() {
    const { inputText } = this.state;
    const { name, url, disable, context, receiveData, emitData, emit, listen } = this.props;

    return (
      <div className="Model-Option">
        <input 
          type="radio" 
          name="" 
          disabled={disable}
          checked={context.model === name}
          onChange={() => {
            this.connect();
            context.setModel(name)
          }} 
        />
        <h2>{name}</h2>
        <a href={url} target='_blank' rel="noopener noreferrer"><code>{url}</code></a>
        {
          name === 'AttnGAN'
          ?
            <input 
              type="text"
              placeholder='Type something...'
              className="Text-Input"
              value={inputText}
              onChange={this.handleInputChange}
            />
          :
            <div className="Model-Buttons">
              <button onClick={() => this.handleStart(true)}>Start</button>
              <button onClick={() => this.handleStart(false)}>Stop</button>
            </div>
        }
        <div className="Model-Socket-Description">
          <div className="Model-Socket-Listeners">
            <p>Socket Event Listener:</p>
            <code>.on('connect')</code>
            <code>.on('{listen}')</code>
            <p>Receive data format:</p>
            <code>{JSON.stringify(receiveData)}</code>
          </div>

          <div className="Model-Socket-Emitter">
            <p>Socket Event Emitters:</p>
            <code>.emit('{emit}')</code>
            <p>Emit data format:</p>
            <code>{JSON.stringify(emitData)}</code>
          </div>
        </div>
      </div>
    );
  }
}

export default withContext(ModelOption);
