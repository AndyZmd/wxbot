var plugin = requirePlugin("WechatSI")
const manager = plugin.getRecordRecognitionManager()
// 当前页面对象
let MyPage;
var innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.autoplay = true;
var chatListData = [];
var that
Page({
  /**
   * 页面的初始数据
   */
  data: {
    defaultCorpus: '你都会什么',
    askWord: '',
    sendButtDisable: true,
    userInfo: {},
    chatList: [],
    scrolltop: '',
    userLogoUrl: '/res/image/user.jpg',
    keyboard: true,
    isSpeaking: false,
    speakerUrlPrefix: '/res/image/speaker',
    speakerUrlSuffix: '.png',
    filePath: null,
    contactFlag: true,
  },
  //加载识别
  onLoad: function () {
    this.initRecord()
  },
  // 切换语音输入和文字输入
  switchInputType: function () {
    this.setData({
      keyboard: !(this.data.keyboard),
    })
  },
  //发送文字 并将文字发送到后台处理
  sendChat: function (e) {
    that = this;
    let word = e.detail.value.ask_word ? e.detail.value.ask_word : e.detail.value;
    if(word.length==0 || word==null){
      return
    }
    that.addChatWithFlag(word, 'r',true);
    that.setData({
      askWord: '',
      sendButtDisable: true,
    });
    that.sendToserver(word)  //此处将文字发送送到后台
  },
  //按下按钮事件
  touchdown: function () {
    // 暂停正在播放的所有语音 
    // this.innerAudioContext.stop();
    // 开始录音
    manager.start({
      duration:30000,lang: "zh_CN"
    });
  },
  //松开按钮事件
  touchup: function (e) {
    // 录音结束时触发 
    manager.stop()
  },
  //初始化
  initRecord: function () {
    that = this;
    // 识别结束事件
    manager.onStop = (res) => {
      console.log("录音的结果是：", res.result)
      // 发送识别文字到后台
      if(res.result==null || res.result ==""){
        return
      }
      var re = res.result.substr(0, res.result.length - 1);//语音识别末尾有句号此处要截掉
      that.addChatWithFlag(re, "r", true)
      that.sendToserver(re)
    }
    // 识别错误事件
    manager.onError = (res) => {
      console.log(res, "识别失败了");
      that.addChatWithFlag("语音出现错误，打字吧", "l",true)
      return
    }
  },
  textToVedio:function(res){
    // 语音播放开始事件
    plugin.textToSpeech({
      lang: "zh_CN",
      tts: true,
      content: res,
      success: function (res) {
        console.log("succ tts", res.filename)
        innerAudioContext.src = res.filename;
        innerAudioContext.onPlay(() => {
          console.log('开始播放')
        })
      },
      fail: function (res) {
        console.log("fail tts", res)
      }
    })
  },
  // 增加对话到显示界面（scrolltopFlag为是否滚动标志）
  addChatWithFlag: function (word, orientation, scrolltopFlag) {
    let ch = { 'text': word, 'time': new Date().getTime(), 'orientation': orientation };
    chatListData.push(ch);
    var charlenght = chatListData.length;
    if (scrolltopFlag) {
      that.setData({
        chatList: chatListData,
        scrolltop: "roll" + charlenght,
      });
    } else {
      that.setData({
        chatList: chatListData,
      });
    }
  },
  //发送 识别后的/文字输入 到后台
  sendToserver: function (res) {
    that = this
    wx.request({
      url: "http://261fd680.ngrok.io/app", //此处填写 后台的服务的地址
      data: {
        sendtext: res,
        method: "GET",
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值form 也可以用json
      },
      success: function (res) {
        that.addChatWithFlag(res.data, "l", true)
        that.textToVedio(res.data)
      },
      fail: function (res) {
        that.addChatWithFlag("对不起，无法回答你的问题", "l", true)
        that.textToVedio("对不起，无法回答你的问题")
      }
    })
  },
})
