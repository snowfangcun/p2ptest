import { Component, OnInit, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Socket, io } from 'socket.io-client';
import { connectPeers, sendMessage } from './page/test';
import { Base64 } from 'js-base64';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'xly_p2p';

  readonly msg = signal<string>('');
  localCandidate: string = "";
  inputLocalIce = ''

  // 本地连接
  private readonly localConnection = new RTCPeerConnection();
  // 本地数据通道
  private sendChannel?: RTCDataChannel;

  socket?: Socket;
  ngOnInit(): void {
    //connectPeers();
    // setTimeout(() => {
    //   sendMessage();
    // }, 3000);
    // this.socket = io('http://127.0.0.1:7777/', {
    //   reconnection: false,
    // });
    // // 连接成功后，拿到连接字符串
    // this.socket.on('connect', () => {
    //   console.log('连接id', this.socket?.id);
    //   // 调用服务器的test方法
    //   this.socket?.emit('test', 'hello', 123);
    //   this.socket?.emit('get_uid', (connCode: string) => {
    //     console.log('get_uid', connCode);
    //     this.connectionCode.set(connCode);
    //   });
    // });

    this.localConnection.onicecandidate = async (e) => {
      if (e.candidate) {
        console.warn('local onicecandidate');
        this.localCandidate = this.base64Encode(JSON.stringify(e.candidate));
      }
    }

    this.localConnection.oniceconnectionstatechange = (event) => {
      alert('oniceconnectionstatechange');
      console.log('iceconnectionstatechange', event);
    };
  }

  readonly callSdp = signal<string | undefined>('');
  readonly answerSdp = signal<string | undefined>('');


  inputCallSdp = '';
  inputAnswerSdp = '';
  clientType: 'caller' | 'answerer' | 'noselect' = 'noselect';
  local_sdp = "";
  answer_sdp = "";


  localStep = 0;
  answerStep = 0;

  msgInput = '';

  async getCallerSdp() {
    try {
      const offer = await this.localConnection.createOffer();
      console.log("步骤1", 'local createOffer');
      await this.localConnection!.setLocalDescription(offer);
      console.log("步骤2", 'local setLocalDescription');
      this.local_sdp = this.base64Encode(JSON.stringify(this.localConnection.localDescription));
      this.localStep = 1;
      navigator.clipboard.writeText(this.local_sdp);
      console.log("复制local_sdp", this.local_sdp);
    } catch (e) {
      alert(e);
    }
  }
  async setAnswer() {
    await this.localConnection.setRemoteDescription(JSON.parse(this.base64Decode(this.inputCallSdp)));
    console.log("步骤3", 'remote setRemoteDescription');

    const answer = await this.localConnection!.createAnswer();
    console.log("步骤4", 'remote createAnswer');

    await this.localConnection.setLocalDescription(answer);
    console.log("步骤5", 'remote setLocalDescription');
    this.answer_sdp = this.base64Encode(JSON.stringify(this.localConnection.localDescription));
    console.log("answer", this.answer_sdp);
    navigator.clipboard.writeText(this.answer_sdp);

  }

  async callSetAnswer() {
    await this.localConnection!.setRemoteDescription(JSON.parse(this.base64Decode(this.inputAnswerSdp)));
    console.log("步骤6", 'local setRemoteDescription');
  }

  addIce() {
    this.localConnection.addIceCandidate(JSON.parse(this.base64Decode(this.inputLocalIce)));
    console.log("步骤7", 'local addIceCandidate');
  }

  copyAnswerSdpToClipboard() {
    navigator.clipboard.writeText(this.answerSdp()!);
  }

  copyCallSdpToClipboard() {
    navigator.clipboard.writeText(this.callSdp()!);
  }

  copyLocalIceToClipboard() {
    console.log('copyLocalIceToClipboard', this.localCandidate);
    navigator.clipboard.writeText(this.localCandidate);
  }

  sendText() {
    if (this.sendChannel) {
      this.sendChannel.send(this.msgInput);
    }
  }

  // base64编码
  base64Encode(str: string) {
    return Base64.encode(str);
  }

  // base64解码
  base64Decode(str: string) {
    return Base64.decode(str);
  }

  selectClient(type: 'caller' | 'answerer') {
    this.clientType = type;
    switch (type) {
      case 'caller':
        this.sendChannel = this.localConnection.createDataChannel("test");
        this.sendChannel.onopen = (event) => {
          console.log('localDataChannel onopen', event);
        }
        this.sendChannel.onmessage = (event) => {
          console.log('localDataChannel onmessage', event.data);
        }
        this.sendChannel.onclose = (event) => {
          console.log('localDataChannel onclose', event);
        }
        break;
      case 'answerer':
        this.localConnection.ondatachannel = (event) => {
          alert('ondatachannel');
          this.sendChannel = event.channel;
          this.sendChannel.onopen = (event) => {
            console.log('localDataChannel onopen', event);
          }
          this.sendChannel.onmessage = (event) => {
            console.log('localDataChannel onmessage', event.data);
          }
          this.sendChannel.onclose = (event) => {
            console.log('localDataChannel onclose', event);
          }
        }
        break;
    }
  }
}
