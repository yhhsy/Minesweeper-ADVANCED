const view = {
  // 初始顯示遊戲畫面，rows 是指遊戲格子的行列數。
  renderFields(rows) {
    const FieldsPanel = document.querySelector('#field-panel')
    let htmlContent = ''
    // [0, 1, ...,8]
    let tempAry = [...Array(rows).keys()]; 
    tempAry.forEach(e1 => {
      htmlContent += `<div class="d-flex">`;
      tempAry.forEach(e2 => {
        htmlContent += `<div data-id="${e1*model.numOfRows+e2}" class="field back"></div>`;
      });
      htmlContent += "</div>";
    });
  FieldsPanel.innerHTML = htmlContent
  },

  // 點開某個格子後的HTML更動
  flipField(field) {
    field.classList.remove('back')
    model.fields[field.dataset.id].isDigged = true
    let number = model.fields[field.dataset.id].number
    switch (model.fields[field.dataset.id].type) {
      case "mine": 
        field.innerHTML = `<i class="fas fa-bomb"></i>`
        return
      case "number": 
        field.innerHTML = `<p class="num-${number}">${number}</p>`
        return
      case "none":
        field.classList.add('none')    
        return
      case "wrongMine":
        field.innerHTML = `<i class="fas fa-bomb"></i>`
        field.classList.add('wrong')
        return
      case "wrongFlag":
        field.innerHTML = `<i class="fas fa-flag"></i>`
        field.classList.add('wrong')
        return
    } 
  },

  showBombNum() {
    const target = document.querySelector("#bomb-num");
    target.innerHTML = `共有${Number(model.numOfMines)}顆`
  },

  // 顯示經過的遊戲時間在畫面上。
  showTime(time) {
    const timer = document.querySelector('#timer')
    timer.innerHTML = `已經過${time}秒`
  },

  showFlagCounter() {
    const target = document.querySelector("#flag-num");
    target.innerHTML = `已放置${model.flags.length}張`;
  },

  // 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
  renderBoard() {
    document.querySelectorAll(".field").forEach(field => {
      let id = field.dataset.id
      if ( (model.fields[id].isDigged) && (model.fields[id].type==='mine') ) {
        model.fields[id].type = 'wrongMine'
      }
      if ( (model.fields[id].isFlagged) && (model.fields[id].type!=='mine') ) {
        model.fields[id].type = 'wrongFlag'
      }
      view.flipField(field) 
    })
  },

  appendFlag(field) {
    field.innerHTML = `<i class="fas fa-flag"></i>`
  },

  removeFlag(field) {
    field.innerHTML = null
  },

  alertWon() {
    alert('You Won~~')
  },

  alertLost() {
    alert('Sorry...Game Over...')
  }

}

const controller = {
  currentState: "initializing",
  // 遊戲開始
  startGame() {
    model.fields.splice(0, model.fields.length)
    model.mines.splice(0, model.mines.length)
    
    model.flags.splice(0, model.flags.length)

    view.renderFields(model.numOfRows)
    view.showTime(model.time = 0)
    view.showFlagCounter();
    view.showBombNum()

    model.firstClickChance = true
    // 初始顯示沒點開的HTML:全暫設為空白，空白==沒地雷也沒在地雷旁邊的格子
    // 埋下地雷: 產生numberOfRows * numberOfRows的一維矩陣
    // 在矩陣前 numberOfMines 的元素埋下地雷
    // 亂數重排矩陣元素 == 亂數重排地雷的位置
    utility.getRandomNumberArray(model.numOfRows * model.numOfRows).map(index => this.setFieldMine(index, model.numOfMines))
    // 計算地雷旁的格子該顯示的數字:數字 == 該格子旁地雷數目
    this.setFieldNum()
    controller.currentState = "ready";
    // controller.listenPlay()
    // controller.listenReset()
  },
  // 尋找所有埋地雷的格子，沒地雷的暫設為空白，空白==沒地雷也沒在地雷旁邊的格子
  setFieldMine(index, numberOfMines) {
    switch (Math.sign(index - numberOfMines)) {
      // 在矩陣前numberOfMines的元素埋下地雷
      case -1:
        model.fields.push({ type: "mine", number: 0, isDigged: false, isFlagged: false, id: model.fields.length })
      return
      // 其他暫設為空白
      default:
        model.fields.push({ type: "none", number: 0, isDigged: false, isFlagged: false, id: model.fields.length })
      return
    }
  },
  // 設定所有"number"的格子、呼叫addNum()計算接鄰之地雷數目。
  setFieldNum() {
    model.mines.length = 0
    // 找出埋地雷的格子們
    model.fields.filter(function (item) {
      if (item.type === "mine") { model.mines.push(item.id) }
    })
    // 替鄰接地雷、沒埋地雷的格子(在location)呼叫addNum(location)
    model.mines.forEach(function (item) {
      controller.findNeighbor(item).forEach(function (location) {
        controller.addNum(location) })
    })
  },
  // 尋找格子 (item: 格子編號) 的鄰居
  findNeighbor(item) {
    let input = []
    let R = model.fields[item + 1]
    let RD = model.fields[item + model.numOfRows + 1]
    let D = model.fields[item + model.numOfRows]
    let LD = model.fields[item + model.numOfRows - 1]
    let L = model.fields[item - 1]
    let LU = model.fields[item - model.numOfRows - 1]
    let U = model.fields[item - model.numOfRows]
    let RU = model.fields[item - model.numOfRows + 1]
    switch (item) {
      // 地雷位置在左上角:
      case 0:
        input = [R, RD, D]
      return input
        // 地雷位置在右上角:
      case (model.numOfRows - 1):
        input = [L, LD, D]
      return input
      // 地雷位置在左下角:
      case (model.numOfRows * (model.numOfRows - 1)):
        input = [U, RU, R]
      return input
      // 地雷位置在右下角: 
      case (model.numOfRows * model.numOfRows - 1):
        input = [LU, U, L]
      return input
    }
    // 地雷位置最左行非角落:  
    if ( !(item % model.numOfRows) ) {
      input = [U, RU, R, RD, D]
      return input
    }
    // 地雷位置最右行非角落:  
    if ( !(item % model.numOfRows - model.numOfRows + 1) ) {
      input = [U, LU, L, LD, D]
      return input
    }
    // 其他地點: 
    input = [LU, U, RU, R, RD, D, LD, L]
    return input
  },
  // 加總某個格子鄰接地雷的數目、設定其type為"number"
  addNum(location) {
  if (location) {
    if (location.type !== "mine") {
      location.number = location.number + 1
      location.type = "number"  
    }
  } 
  },
  // 收放旗子
  flag() {
    event.preventDefault()
    const fieldIdx = event.target.dataset.id 
    if (model.isDigged(fieldIdx)) {return}
    if (model.isFlagged(fieldIdx)) {
      view.removeFlag(event.target)
      model.setFlag(fieldIdx, false)
      model.flags.splice(model.flags.indexOf(fieldIdx), 1);
    }
    else {
      view.appendFlag(event.target)
      model.setFlag(fieldIdx, true)
      model.flags.push(fieldIdx);
    }
    view.showFlagCounter();
    this.checkWin()
  },
  // 如果是號碼或none => 顯示格子；如果是地雷 => 遊戲結束  
  dig(field) { 
    // 若有插旗不可挖
    const fieldIdx = field.dataset.id
    if (model.isFlagged(fieldIdx)) {
      return
    }
    if (field.classList.contains('back')) {  
      switch (model.fields[field.dataset.id].type) {
        case "mine": 
          //第一次點炸彈會換位置
          if (model.firstClickChance) {
            this.changeMineLocation(field);
            model.firstClickChance = false;
            this.dig(field);
            return;
          }
          model.fields[field.dataset.id].isDigged = true
          controller.currentState = 'gameOver'
          this.checkWin()
        return
        case "number": 
          view.flipField(field)
          model.fields[field.dataset.id].isDigged = true
          model.firstClickChance = false;
          this.checkWin() 
        return
        case "none":
          view.flipField(field)
          model.fields[field.dataset.id].isDigged = true  
          controller.spreadNone(field)
          model.firstClickChance = false;
          this.checkWin()
        return
        default : return           
      }  
    }
  },
  // 檢查是否完成遊戲
  checkWin() {
    const countDigged = model.fields.filter(element => element.isDigged).length
    const countFlagged = model.fields.filter(element => element.isFlagged).length
    const countTotal = countDigged + countFlagged
    if (controller.currentState === 'gameOver') {
      controller.checkTimer()
      view.renderBoard()
      view.alertLost()
      return
    }
    if ((countTotal === ((model.numOfRows) * (model.numOfRows))) && (countFlagged === model.mines.length)) {
      controller.currentState = "win"
      controller.checkTimer()
      view.alertWon()
    }
  },
  // 展開空白   
  spreadNone(field) {
    // 找出鄰居是數字或空白的
    controller.findNeighbor(Number(field.dataset.id)).forEach(function (elm) 
    { 
      if (!elm) return 
      if ((elm.type === "number") && (elm.isDigged === false)) {
        // ============================================================ //
        document.querySelectorAll(".field").forEach(field => { 
          if (Number(field.dataset.id) === elm.id) {
            view.flipField(field)
          }
        })
      }
      if ((elm.type === "none") && (elm.isDigged === false)) { 
        document.querySelectorAll(".field").forEach(field => { 
          if (Number(field.dataset.id) === elm.id) {
            view.flipField(field) 
            // 並繼續點開它們
            controller.spreadNone(field)
          }
        }
        )
      }
    })
  controller.checkWin()  
  },
  // 計時器  
  checkTimer() { 
    // gameOver or win or gameReset 狀態 => 結束計時     
    if ( controller.currentState === 'gameOver' || controller.currentState === 'win' || controller.currentState === 'gameReset') {
      clearInterval(controller.myTimer)
      return
    }
  },
  // 開始計時
  myCounter() { 
    model.time = model.time + 1
    view.showTime(model.time)
  },
  // 第一次點到炸彈免疫
  changeMineLocation(field) {
    const id = field.dataset.id;
  
    //移除這次的炸彈 (處理index、fields)
    model.fields[id].type = "none";
    model.mines.splice(model.mines.indexOf(id), 1);
    model.fields.forEach(i => i.number = 0)
    // 由非炸彈區產生新炸彈index
    const noMineIndexAry = [];
    model.fields.forEach(e => {
      if (e.type !== "mine") {
        noMineIndexAry.push(e.id);
      }
    });
    const newMineIndex =
    noMineIndexAry[Math.floor(Math.random() * noMineIndexAry.length)];
    //加回mines
    model.mines.push(newMineIndex);
    model.fields[newMineIndex].type = "mine";
    model.fields[newMineIndex].number = 0;
    //處理number, none
    controller.setFieldNum()
  },
  // 監聽是否按下重來按鍵
  listenReset(){
    document.querySelector("#reset").addEventListener('click', e => {
      controller.currentState = 'gameReset'
      controller.checkTimer()
      controller.startGame()
    })
  },
  // 監聽使用者輸入
  listenInput() {
    const customizedCreateBtn = document.querySelector("#customized-create-btn");
    const customizedInputRow = document.querySelector("#customized-input-row");
    const customizedInputBombNumber = document.querySelector("#customized-input-bomb-number");
    customizedCreateBtn.addEventListener("click", function (e) {
      const inputRow = +customizedInputRow.value;
      const inputBombNumber = +customizedInputBombNumber.value;
      if (isNaN(inputRow) || isNaN(inputBombNumber)) {
        alert("請輸入數字");
        customizedInputRow.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow % 1 !== 0 || inputBombNumber % 1 !== 0) {
        alert("請輸入整數");
        customizedInputRow.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow < 0 || inputBombNumber < 0) {
        alert("請不要輸入負數");
        customizedInputRow.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow <= 3) {
        alert("建議大一點");
        customizedInputRow.value = "";
      } else if (inputRow * inputRow - inputBombNumber < 9) {
        alert("炸彈太多喔");      
        customizedInputBombNumber.value = "";
      } else if (inputBombNumber <= 0) {
        alert("沒有放地雷耶");
        customizedInputBombNumber.value = "";
      } else {
        if (inputRow >= 20) {
        alert("行列數太大囉"); 
        customizedInputRow.value = "";
        return;  
        }
        // 輸入設定
        model.numOfRows = inputRow;
        model.numOfMines = inputBombNumber;
        controller.currentState = 'gameReset'
        controller.checkTimer()
        controller.startGame()
      }
    });
  },
  // 監聽開始了沒   
  listenPlay() {
    // 滑鼠按左鍵就呼叫開格子程式controller.dig()
    // 滑鼠按右鍵就呼叫放旗子程式controller.flag()
    document.querySelector("#field-panel").addEventListener('click', e => {
      if(controller.currentState === "ready") {
        controller.currentState = "running"
        controller.myTimer = setInterval(controller.myCounter, 1000)
      }
      controller.dig(e.target)
    })
    document.querySelector("#field-panel").addEventListener('contextmenu', e => {
      if(controller.currentState === "ready") {
        controller.currentState = "running"
        controller.myTimer = setInterval(controller.myCounter, 1000)
      }
      controller.flag()
    })
  },
}

const model = {
  numOfRows: 9,
  numOfMines: 12,
  time:0,
  firstClickChance: true,
  // 存放地雷的位置 { id:位置 }
  mines: [],
  // {  id:位置, type: 地雷、數字或空白, number: 鄰接地雷數目, isDigged: 點開了嗎, isFlagged: 插旗了嗎 }
  fields: [],
  flags: [],

  //  輸入一個格子位置，並檢查是否有地雷
  isMine(fieldIdx) {
    return this.mines.includes(Number(fieldIdx))
  },
  // 檢查格子是否已設 flag
  isFlagged(fieldIdx) {
    return this.fields[Number(fieldIdx)].isFlagged
  },
  // 檢查格子是否已 dig
  isDigged(fieldIdx) {
    return this.fields[Number(fieldIdx)].isDigged
  },
  // 設定格子是否 dig
  setDig(fieldIdx, booleanValue) {
    this.fields[Number(fieldIdx)].isDigged = booleanValue
  },
  // 設定格子是否插旗
  setFlag(fieldIdx, booleanValue) {
    this.fields[Number(fieldIdx)].isFlagged = booleanValue
  },
}

const utility = {
  /**
   * getRandomNumberArray()
   * 取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列。
   * 例如：
   *   getRandomNumberArray(4)
   *     - [3, 0, 1, 2]
   */
  getRandomNumberArray(count) {
    const number = [...Array(count).keys()]
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }

    return number
  }
}


controller.startGame()
controller.listenPlay()
controller.listenReset()
controller.listenInput()

