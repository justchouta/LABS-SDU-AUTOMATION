import puppeteer, { Page } from "puppeteer";
import PlayGame from "./play";
import { alertPage, sleep} from "./utils";
import dotenv from 'dotenv';
dotenv.config();

//NEED TO CHANGE THESE TWO LINES FOR THE BOT TO WORK
/***************************************************************************************************************************************************/
const paused = false
const extensionPath = process.env.EXTENTION_PATH; //created .env file to keep extension path secret.
/***************************************************************************************************************************************************/


// 1 minute in milliseconds
let PLAY_FOR_BEFORE_REFRESH = 60 * 1 * 1000;


(async () => {
  // Set the path to your Chrome extension folder

  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser in action
    userDataDir: "./user_data",
    defaultViewport: {
      width: 3440,
      height: 1440
    },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  // somehow have to setup the solflare wallet
  // and connect to the burner wallet and setup auto approve

  // Open a new page and navigate to a website
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const box = document.createElement('puppeteer-mouse-pointer');
      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        puppeteer-mouse-pointer {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10000;
          left: 0;
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,.4);
          border: 1px solid white;
          border-radius: 10px;
          margin: -10px 0 0 -10px;
          padding: 0;
          transition: background .2s, border-radius .2s, border-color .2s;
        }
        puppeteer-mouse-pointer.button-1 {
          transition: none;
          background: rgba(0,0,0,0.9);
        }
        puppeteer-mouse-pointer.button-2 {
          transition: none;
          border-color: rgba(0,0,255,0.9);
        }
        puppeteer-mouse-pointer.button-3 {
          transition: none;
          border-radius: 4px;
        }
        puppeteer-mouse-pointer.button-4 {
          transition: none;
          border-color: rgba(255,0,0,0.9);
        }
        puppeteer-mouse-pointer.button-5 {
          transition: none;
          border-color: rgba(0,255,0,0.9);
        }
      `;
      document.head.appendChild(styleElement);
      document.body.appendChild(box);
      document.addEventListener('mousemove', event => {
        box.style.left = event.pageX + 'px';
        box.style.top = event.pageY + 'px';
        updateButtons(event.buttons);
      }, true);
      document.addEventListener('mousedown', event => {
        updateButtons(event.buttons);
        box.classList.add('button-' + event.which);
      }, true);
      document.addEventListener('mouseup', event => {
        updateButtons(event.buttons);
        box.classList.remove('button-' + event.which);
      }, true);
      function updateButtons(buttons) {
        for (let i = 0; i < 5; i++)
        box.classList.toggle('button-' + i, Boolean(buttons & (1 << i)));

      }
    }, false);
  });
  

  await page.goto("https://labs.staratlas.com", {
    waitUntil: "networkidle2",
  });

  const allPages = await browser.pages();
  const secondTab = allPages[1];
  await secondTab.bringToFront(); // This line is optional, as Puppeteer interacts with the page object regardless of the visual focus

  // put an alert confirm popup
  await alertPage(page, "Setup your wallet and Press Ok");

  const { width, height } = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
  });

  while (true) {

    await sleep(5000);
    if(!paused){
      await initializeGame(page);
    }
    await sleep(10000);
    console.log("Starting to play the game");
    let start_time = new Date().getTime();
    try {
      const playGame = new PlayGame(page, width, height);
      while (true) {
         //if been playing for more than 1 hour refresh page
        if (new Date().getTime() - start_time > PLAY_FOR_BEFORE_REFRESH) {
          await playGame.startPlaying();
          await page.reload();
          break;
        }
        if(!paused){
          await playGame.startPlaying();
        }
      }
    } catch (e) {
      console.log(e);
      console.log("GOT ERRROR");
      // Close the browser when you're done
      await browser.close();
    }
  }
})();

async function initializeGame(page: Page) {
  // Get the dimensions of the viewport
  const { width, height } = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
  });

  // Calculate the center coordinates
  const centerX = width / 2;
  const centerY = height / 2;


  // Connect Wallet
  console.log("Clicking Connect Wallet at: ", centerX, centerY + 250);
  await page.mouse.click(centerX, centerY +  250);
  await sleep(2000);
 

  // Launch Game
  console.log("Clicking Launch Game at: ", centerX, centerY + 100);
  await page.mouse.click(centerX, centerY + 100);
  await sleep(2000);
 

  // Select Wallet
  console.log("Clicking Select Wallet at: ", centerX, centerY - 50);
  await page.mouse.click(centerX, centerY - 50);
  await sleep(5000);


  // Connect
  console.log("Clicking Connect at: ", centerX, centerY - 50);
  await page.mouse.click(centerX, centerY + 210);
  await sleep(8000);


  // Play Game
  console.log("Clicking Play Game at: ", centerX, centerY - 50);
  await page.mouse.click(centerX, centerY + 100);
  await sleep(6000);
}

export { extensionPath };