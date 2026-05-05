enum GameState {
    Passive,
    Started,
    Running
}

const MIN_WAIT_SECONDS = 3
const MAX_WAIT_SECONDS = 6
const POLLING_INTERVAL_MS = 50
const RESULT_DISPLAY_MS = 1000

const START_TONE_HZ = 262
const SIGNAL_TONE_HZ = 584
const SUCCESS_TONE_HZ = 659
const FAILURE_TONE_HZ = 131
const DRAW_TONE_HZ = 523

let gameState = GameState.Passive
let pressedA = false
let pressedB = false

function playToneAsync(frequency: number, duration: number): void {
    control.runInBackground(function () {
        music.playTone(frequency, duration)
    })
}

function drawHourglass(): void {
    basic.clearScreen()
    
    const maxX = 4;
    const maxY = 4;
    for (let y = 0; y <= maxY; y++) {
        const left = Math.min(y, maxY - y);
        const right = maxX - left;

        for (let x = left; x <= right; x++) {
            led.plot(x, y);
        }
    }
}

function waitForPlayersToReleaseButtons(): void {
    while (input.buttonIsPressed(Button.A) || input.buttonIsPressed(Button.B)) {
        basic.pause(POLLING_INTERVAL_MS)
    }
}

function resetToPassive(): void {
    gameState = GameState.Passive
    pressedA = pressedB = false;
    waitForPlayersToReleaseButtons()
    basic.clearScreen()
}

function showWinner(player: string): void {
    basic.showString(player)
    playToneAsync(SUCCESS_TONE_HZ, 300)
}

function showDraw(): void {
    basic.showIcon(IconNames.Square)
    playToneAsync(DRAW_TONE_HZ, 300)
    basic.pause(RESULT_DISPLAY_MS)
}

function showDisqualification(): void {
    basic.showIcon(IconNames.Sad)
    playToneAsync(FAILURE_TONE_HZ, 400)
    basic.pause(RESULT_DISPLAY_MS)
}

function evaluateFalseStart(): void {
    if (pressedA && pressedB) {
        showDisqualification()
        resetToPassive()
    } else if (pressedA) {
        showWinner("B")
        resetToPassive()
    } else if (pressedB) {
        showWinner("A")
        resetToPassive()
    } else {
        gameState = GameState.Running
    }
}

function runReactionPhase(): void {
    if (gameState != GameState.Running) {
        return
    }
    pressedA = pressedB = false

    basic.showIcon(IconNames.Pitchfork,0)
    playToneAsync(SIGNAL_TONE_HZ, 200)
    while (gameState == GameState.Running) {
        basic.pause(0)
        if (pressedA && pressedB) {
            showDraw()
            resetToPassive()
        } else if (pressedA) {
            showWinner("A")
            resetToPassive()
        } else if (pressedB) {
            showWinner("B")
            resetToPassive()
        }
    }
}

function runRound(): void {
    gameState = GameState.Started
    pressedA = pressedB = false
    drawHourglass()
    playToneAsync(START_TONE_HZ, 200)
    basic.pause(randint(MIN_WAIT_SECONDS * 1000, MAX_WAIT_SECONDS * 1000))
    evaluateFalseStart()
    runReactionPhase()
}

basic.clearScreen()

basic.forever(function () { //default polling interval = 20ms
    if (gameState == GameState.Passive && input.buttonIsPressed(Button.AB)) {
        waitForPlayersToReleaseButtons()
        runRound()
    } else {
        basic.pause(POLLING_INTERVAL_MS)
    }
})

control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A, EventBusValue.MICROBIT_BUTTON_EVT_DOWN, function () {
    if (gameState === GameState.Started || gameState == GameState.Running) {
        pressedA = true
    }
})

control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B, EventBusValue.MICROBIT_BUTTON_EVT_DOWN, function () {
    if (gameState === GameState.Started || gameState == GameState.Running) {
        pressedB = true
    }
})
