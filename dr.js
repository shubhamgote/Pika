import {settingImage} from "./utilities/settingImageAndTextOnParent.js";
const encryptStorage = new EncryptStorage('celebrare-secret-storage');
const encryptSessionStorage = new EncryptStorage('celebrare-secret-storage',{
    storageType:'sessionStorage'
});
var draftcards = document.querySelector('.draft-cards');
let fontstyles = JSON.parse(localStorage.getItem("customizeFonts"));
let scale = 220/1080 

let drafts = encryptStorage.getItem("draft-image");
let videoDrafts;
var downloadContainer = document.getElementById('download-modal-container');
let draftVideosContainer = document.querySelector(".draft-videos");
let videoIntervals = {};
let userId;
let fetchInterval;

// ===================
let cardData= null;
let cardArray = null;
var progressText = document.getElementById('noOfCards');

// ========================

window.addEventListener("load",async (e)=>{
    await checkUserLoginStatus();
})


  /* ------------------------------------- Loader Section -------------------------------------------- */

  // adds a loader container
  function addLoader(parentId) {
    let parent = document.getElementById(parentId);
    let loader = document.createElement('div');
    loader.classList.add('loading-container');
    loader.setAttribute('id', parentId + '-loader');
    parent.append(loader);
    startLoadAnimation(parentId + '-loader');
    loader.style.display = 'flex';
  }

  // adds loading animation to the container having loaderId
  function startLoadAnimation(loaderId) {
    lottie.loadAnimation({
      container: document.getElementById(loaderId),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/animations/ring-json-lottie.json',
    });
  }

  /* ------------------------------------- Loader Section ends here -------------------------------------------- */


async function readyToDownload(cardType, totalCards, imageDiv, canvasStartDiv) {
    let doc_ref = await db.collection('rating').doc('allcard')
    if(cardType == 'sample') {
        doc_ref.update({
            [cardID]: firebase.firestore.FieldValue.increment(50)
        })
    } else if(cardType == 'purchase') {
        doc_ref.update({
            [cardID]: firebase.firestore.FieldValue.increment(50)
        })
    }
    let currentLanguage = localStorage.getItem("selected-language");
    let ProcessingPageText;
    let ProcessingCompleted;
        ProcessingPageText="Processing page "
        ProcessingCompleted="Processing Completed..."
    var image = new Image();
    image.src = '../assets/img/watermark_sample.webp';
    image.crossOrigin = 'Anonymous';
    var watermark;
    image.onload = function () {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        context.drawImage(this, 0, 0);
        watermark = canvas.toDataURL('image/png');
    };

    document.getElementById('download-loader').style.display = 'block'
    document.getElementById('download-modal').style.display = 'flex';

    cardArray = []
    for (let i = 0; i < totalCards; i++) {
        var imgdiv = document.querySelector(`${imageDiv}-${i}`);
        if (imgdiv.hasAttribute('hidden')) {
            imgdiv.removeAttribute('hidden');
        }

        progressText.innerText = `${ProcessingPageText} ${i + 1}...`;

        if(cardType == 'sample' || cardType == 'draft') {
            await html2canvas(document.querySelector(`${canvasStartDiv}-${i}`), {     //to convert html to canvas
                allowTaint: true,
                useCORS: true,
                scale: 4, //Increase to make clear pdf's; As this is handle rendering of the document
                logging: false, //To disable logging in console.
            }).then(function (canvas) {
                cardArray.push(canvas.toDataURL());
            });
        } else {
            await html2canvas(document.querySelector(`${canvasStartDiv}-${i}`), {     //to convert html to canvas
                allowTaint: true,
                useCORS: true,
                scale: 4, //Increase to make clear pdf's; As this is handle rendering of the document
                logging: false, //To disable logging in console.
            }).then(function (canvas) {
                cardArray.push(canvas.toDataURL());
            });
        }

        imgdiv.setAttribute('hidden', 'true');
    }
    document.querySelector(`${imageDiv}-0`).removeAttribute('hidden');
    progressText.innerText = ProcessingCompleted;
    document.getElementById('download-loader').style.display = 'none';
    document.getElementById('download-modal-close').style.display = 'block';
    document.getElementById('download-modal-close').addEventListener('click', ()=>{
        document.getElementById('download-modal').style.display= 'none';
        document.getElementById('download-modal-close').style.display = 'none';
    }) ;

    var pdf = new jsPDF('p', 'mm', 'a4', true);

    var width1 = pdf.internal.pageSize.width;
    var height1 = pdf.internal.pageSize.height;

    for (let j = 0; j < cardArray.length; j++) {
        pdf.addImage(`${cardArray[j]}`, 'PNG', 0, 0, width1 +1, height1 +6, undefined, 'FAST')
        if (cardType == 'sample' || cardType == 'draft') {
            pdf.addImage(`${cardArray[j]}`, 'PNG', 0, 0, width1 +1, height1 +6, undefined, 'FAST')
        }
        if (j < cardArray.length - 1) {
            pdf.addPage('a4')
        }
    }

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.open(pdf.output('bloburl'), '_blank')
    }
    await pdf.save(`Wedding Invitation.pdf`);  //To be uncommented

    if(cardType == 'purchase'){
        window.location.href = './my-order';
    }
}


function customize(param) {
    let cardData = encryptStorage.getItem("draft-image")[param];
    encryptStorage.setItem("isUserCommingFromEditingScreen", false)
    encryptSessionStorage.setItem('card-data',cardData);
    encryptSessionStorage.setItem("draft-id",JSON.stringify(param));
    window.location.href = '/weddingPageEdit?cardID='+encryptStorage.getItem("draft-image")[param]['cardID'];
}

function deleteDraft(param) {
    cardData.splice(param,1);
    encryptStorage.setItem("draft-image",cardData)
    window.location.href= '/draft';
}

async function download(param) {
    await readyToDownload('draft',document.getElementById(`card-container-${param}`).children.length - 1, `div#card-container-${param} #card`, `div#card-container-${param} #content-items-${param}`)
}

async function checkUserLoginStatus() {
    await firebase.auth().onAuthStateChanged(async function (user) {
        if (!user) {
            document.querySelector('.login-btn').click();
            document.querySelector(".login-container .close-modal").addEventListener("click", () => {
                window.location.href = "/";
              });
        } else {
            userId = user.uid;
            videoDrafts = await db.collection("video_invite").doc("userCreatedVideos").collection("sampleVideo").doc(userId).get();
            videoDrafts = await videoDrafts.data();
            if ((drafts == null || drafts == undefined || drafts == '') && (videoDrafts == null || videoDrafts == undefined || videoDrafts == '')) {
                document.getElementById('alert-modal').style.display = 'flex';
                document.getElementById('alert-modal-close').addEventListener('click', ()=>{
                    document.getElementById('alert-modal').style.display = 'none';
                    window.location.href = '/wedding-card/all';
                })
            } else {
                if(!(drafts == null || drafts == undefined || drafts == '')){
                    if(Object.keys(drafts).length==0){
                        document.querySelector(".card-empty-error").style.display = "block";
                    }
                    displayDraftCards();
                }else{
                    document.querySelector(".card-empty-error").style.display = "block";
                }
                if(!(videoDrafts == null || videoDrafts == undefined || videoDrafts == '' || videoDrafts == '{}')){
                    if(Object.keys(videoDrafts).length==0){
                        document.querySelector(".video-empty-error").style.display = "block";
                    }
                    displayDraftVideos()
                }else{
                    document.querySelector(".video-empty-error").style.display = "block";
                }
            }
        }
    })
}

async function displayDraftCards() {
    cardData = encryptStorage.getItem("draft-image")
    if(window.innerWidth <= 425) {
        scale = 0.15
    } else {
        scale = 0.22
    }
    document.getElementById("my-drafts-title").innerHTML += ` ( ${cardData.length} ) `;

    for (let j = 0; j < cardData.length; j++) {
        var card = document.createElement('div');
        var actionButtonContainer = document.createElement('div');
        var actionButtons = document.createElement('div');
        var customizeButton = document.createElement('button');
        var deleteButton = document.createElement('button');
        var downloadButton = document.createElement('button');
        var purchaseButton = document.createElement('button');

        card.setAttribute('class', 'card-container');
        card.setAttribute('id', `card-container-${j}`);
        actionButtonContainer.setAttribute('style', 'display: flex; flex-direction:column; justify-content:center; margin-top: 0px;')
        actionButtons.setAttribute('style', 'width: 100%; display: flex;  flex-direction:column; justify-content: center; align-items: center;')
        customizeButton.setAttribute('class', 'customize-btn')
        deleteButton.setAttribute('class', 'delete-btn')
        purchaseButton.setAttribute('class', 'purchase-btn')
        customizeButton.setAttribute('style', 'cursor: pointer; display:flex; justify-content:center; align-items:center; background-color: white; color: #4E9459; width: 100%; padding: 5%; margin: 2%; border-radius: 52px; border: 1px solid #A0A0A0;gap:0.4em;')
        purchaseButton.setAttribute('style', 'cursor: pointer; display:flex; justify-content:center; align-items:center; background-color: #4E9459; color: white; width: 100%; padding: 5%; margin: 2%; border-radius: 52px; border: none; gap:0.4em')
        customizeButton.innerHTML = `Continue Edit <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.7364 3.01413L14.9864 0.264135C14.9226 0.200213 14.8467 0.149504 14.7633 0.114906C14.6798 0.0803079 14.5903 0.0625 14.5 0.0625C14.4097 0.0625 14.3202 0.0803079 14.2367 0.114906C14.1533 0.149504 14.0774 0.200213 14.0136 0.264135L5.76359 8.51413C5.69977 8.57803 5.64916 8.65387 5.61466 8.73733C5.58015 8.82079 5.56243 8.91023 5.5625 9.00054V11.7505C5.5625 11.9329 5.63493 12.1077 5.76386 12.2367C5.8928 12.3656 6.06766 12.438 6.25 12.438H9C9.09031 12.4381 9.17975 12.4204 9.26321 12.3859C9.34667 12.3514 9.42251 12.3008 9.48641 12.2369L17.7364 3.98695C17.8003 3.9231 17.851 3.84727 17.8856 3.76381C17.9202 3.68035 17.938 3.59089 17.938 3.50054C17.938 3.41019 17.9202 3.32073 17.8856 3.23727C17.851 3.15381 17.8003 3.07798 17.7364 3.01413ZM8.71555 11.063H6.9375V9.28499L12.4375 3.78499L14.2155 5.56304L8.71555 11.063ZM15.1875 4.59109L13.4095 2.81304L14.5 1.72249L16.278 3.50054L15.1875 4.59109ZM17.25 9.00054V15.8755C17.25 16.2402 17.1051 16.5899 16.8473 16.8478C16.5894 17.1057 16.2397 17.2505 15.875 17.2505H2.125C1.76033 17.2505 1.41059 17.1057 1.15273 16.8478C0.894866 16.5899 0.75 16.2402 0.75 15.8755V2.12554C0.75 1.76087 0.894866 1.41113 1.15273 1.15327C1.41059 0.895406 1.76033 0.750541 2.125 0.750541H9C9.18234 0.750541 9.35721 0.822974 9.48614 0.951905C9.61507 1.08084 9.6875 1.2557 9.6875 1.43804C9.6875 1.62038 9.61507 1.79525 9.48614 1.92418C9.35721 2.05311 9.18234 2.12554 9 2.12554H2.125V15.8755H15.875V9.00054C15.875 8.8182 15.9474 8.64334 16.0764 8.51441C16.2053 8.38547 16.3802 8.31304 16.5625 8.31304C16.7448 8.31304 16.9197 8.38547 17.0486 8.51441C17.1776 8.64334 17.25 8.8182 17.25 9.00054Z" fill="#4E9459"/>
</svg>
`
        deleteButton.innerHTML= `<svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.4062 3.3125H13.8125V2.59375C13.8125 2.02188 13.5853 1.47343 13.1809 1.06905C12.7766 0.664676 12.2281 0.4375 11.6562 0.4375H7.34375C6.77188 0.4375 6.22343 0.664676 5.81905 1.06905C5.41468 1.47343 5.1875 2.02188 5.1875 2.59375V3.3125H1.59375C1.40313 3.3125 1.22031 3.38823 1.08552 3.52302C0.950725 3.65781 0.875 3.84063 0.875 4.03125C0.875 4.22187 0.950725 4.40469 1.08552 4.53948C1.22031 4.67427 1.40313 4.75 1.59375 4.75H2.3125V17.6875C2.3125 18.0687 2.46395 18.4344 2.73353 18.704C3.00312 18.9735 3.36875 19.125 3.75 19.125H15.25C15.6312 19.125 15.9969 18.9735 16.2665 18.704C16.536 18.4344 16.6875 18.0687 16.6875 17.6875V4.75H17.4062C17.5969 4.75 17.7797 4.67427 17.9145 4.53948C18.0493 4.40469 18.125 4.22187 18.125 4.03125C18.125 3.84063 18.0493 3.65781 17.9145 3.52302C17.7797 3.38823 17.5969 3.3125 17.4062 3.3125ZM6.625 2.59375C6.625 2.40313 6.70073 2.22031 6.83552 2.08552C6.97031 1.95073 7.15313 1.875 7.34375 1.875H11.6562C11.8469 1.875 12.0297 1.95073 12.1645 2.08552C12.2993 2.22031 12.375 2.40313 12.375 2.59375V3.3125H6.625V2.59375ZM15.25 17.6875H3.75V4.75H15.25V17.6875ZM8.0625 8.34375V14.0938C8.0625 14.2844 7.98677 14.4672 7.85198 14.602C7.71719 14.7368 7.53437 14.8125 7.34375 14.8125C7.15313 14.8125 6.97031 14.7368 6.83552 14.602C6.70073 14.4672 6.625 14.2844 6.625 14.0938V8.34375C6.625 8.15313 6.70073 7.97031 6.83552 7.83552C6.97031 7.70073 7.15313 7.625 7.34375 7.625C7.53437 7.625 7.71719 7.70073 7.85198 7.83552C7.98677 7.97031 8.0625 8.15313 8.0625 8.34375ZM12.375 8.34375V14.0938C12.375 14.2844 12.2993 14.4672 12.1645 14.602C12.0297 14.7368 11.8469 14.8125 11.6562 14.8125C11.4656 14.8125 11.2828 14.7368 11.148 14.602C11.0132 14.4672 10.9375 14.2844 10.9375 14.0938V8.34375C10.9375 8.15313 11.0132 7.97031 11.148 7.83552C11.2828 7.70073 11.4656 7.625 11.6562 7.625C11.8469 7.625 12.0297 7.70073 12.1645 7.83552C12.2993 7.97031 12.375 8.15313 12.375 8.34375Z" fill="#858585"/>
</svg>


`
purchaseButton.innerHTML = `Download Now <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.125 12.9375V18.6875C20.125 18.8781 20.0493 19.0609 19.9145 19.1957C19.7797 19.3305 19.5969 19.4062 19.4062 19.4062H3.59375C3.40313 19.4062 3.22031 19.3305 3.08552 19.1957C2.95073 19.0609 2.875 18.8781 2.875 18.6875V12.9375C2.875 12.7469 2.95073 12.5641 3.08552 12.4293C3.22031 12.2945 3.40313 12.2188 3.59375 12.2188C3.78437 12.2188 3.96719 12.2945 4.10198 12.4293C4.23677 12.5641 4.3125 12.7469 4.3125 12.9375V17.9688H18.6875V12.9375C18.6875 12.7469 18.7632 12.5641 18.898 12.4293C19.0328 12.2945 19.2156 12.2188 19.4062 12.2188C19.5969 12.2188 19.7797 12.2945 19.9145 12.4293C20.0493 12.5641 20.125 12.7469 20.125 12.9375ZM10.9915 13.446C11.0582 13.5128 11.1375 13.5659 11.2248 13.602C11.312 13.6382 11.4055 13.6568 11.5 13.6568C11.5945 13.6568 11.688 13.6382 11.7752 13.602C11.8625 13.5659 11.9418 13.5128 12.0085 13.446L15.6023 9.85227C15.669 9.78549 15.722 9.70621 15.7582 9.61896C15.7943 9.53171 15.8129 9.43819 15.8129 9.34375C15.8129 9.24931 15.7943 9.15579 15.7582 9.06854C15.722 8.98129 15.669 8.90201 15.6023 8.83523C15.5355 8.76846 15.4562 8.71548 15.369 8.67934C15.2817 8.6432 15.1882 8.6246 15.0938 8.6246C14.9993 8.6246 14.9058 8.6432 14.8185 8.67934C14.7313 8.71548 14.652 8.76846 14.5852 8.83523L12.2188 11.2026V2.875C12.2188 2.68438 12.143 2.50156 12.0082 2.36677C11.8734 2.23198 11.6906 2.15625 11.5 2.15625C11.3094 2.15625 11.1266 2.23198 10.9918 2.36677C10.857 2.50156 10.7812 2.68438 10.7812 2.875V11.2026L8.41477 8.83523C8.2799 8.70037 8.09698 8.6246 7.90625 8.6246C7.71552 8.6246 7.5326 8.70037 7.39773 8.83523C7.26287 8.9701 7.1871 9.15302 7.1871 9.34375C7.1871 9.53448 7.26287 9.7174 7.39773 9.85227L10.9915 13.446Z" fill="white"/>
</svg>

`

        customizeButton.addEventListener('click', () => customize(j));
        deleteButton.addEventListener('click', () => deleteDraft(j));
        purchaseButton.addEventListener('click', () => download(j));


        draftcards.appendChild(card)

        var individualCardData = cardData[j]['pageData']
        for (let i = 0; i < individualCardData.length; i++) {
            var imgdiv = document.createElement('div')
            imgdiv.setAttribute('id', `card-${i}`)
            imgdiv.setAttribute('class', 'cards')
            var imgcontent = document.createElement('div')
            imgcontent.setAttribute('id', `content-items-${j}-${i}`)
            imgcontent.setAttribute('style', 'position: relative; aspect-ratio: 2/3; background-color: white;')
            if (i != 0) {
                imgdiv.setAttribute('hidden', 'true')
            }

            card.appendChild(imgdiv).appendChild(imgcontent)
            settingImage(`content-items-${j}-${i}`, individualCardData[i]['pageText'], individualCardData[i]['mediumImg'], individualCardData[i]['pageTextStyle'], scale, `content-loader-${j}-${i}`,"regular",individualCardData[i]["iconList"])
        }
        card.appendChild(actionButtonContainer).appendChild(actionButtons)
        actionButtons.appendChild(purchaseButton)
        actionButtons.appendChild(customizeButton)
        actionButtons.appendChild(deleteButton)
    }
}


var loader = document.createElement('div');
loader.setAttribute('id','download-loader');
loader.setAttribute('style', 'height: 40%;  width: 100%');
downloadContainer.appendChild(loader);


startLoadAnimation('download-loader');

function sortByTime(data){
    let videoIDs = Object.keys(data);
    let videoIDsWithTime = []
    let videoIDsWithoutTime = []
    videoIDs.sort((a,b) =>{
      if("lastUpdatedAt" in data[a] && "lastUpdatedAt" in data[b]){
        return new Date(data[b]["lastUpdatedAt"]) - new Date(data[a]["lastUpdatedAt"])
      }
      return 0;
    })
    videoIDs.forEach((videoID)=>{
        if(data[videoID]["lastUpdatedAt"])
            videoIDsWithTime.push(videoID);
        else
            videoIDsWithoutTime.push(videoID);
    })
    return [...videoIDsWithTime, ...videoIDsWithoutTime];
}

async function displayDraftVideos(){
    let unsavedVideoData = JSON.parse(localStorage.getItem('draftUnsavedVideo'));
    if(unsavedVideoData){
        document.querySelector(".unsaved-video-note").style.display = "block";
        document.querySelector(".unsaved-video-note").addEventListener("click", ()=>{
            window.location.href = "/video-invitation/videoEditingScreen?draftID=unsavedDraft_"+userId
        })
    }
    let sortedVideoIDs = sortByTime(videoDrafts)
    document.getElementById("saved-videos-title").innerHTML += ` ( ${sortedVideoIDs.length} ) `;

    for(let i=0;i<sortedVideoIDs.length;i++){
        let projectId = sortedVideoIDs[i];
        let currentVideoData = videoDrafts[sortedVideoIDs[i]];
        let videoNameContainer = document.createElement('div');
        if(currentVideoData["title"]){
            videoNameContainer.classList.add("video-name");
            videoNameContainer.innerHTML = currentVideoData["title"];
        }
        if(!currentVideoData["link"].includes("celebrare") && !currentVideoData["link"].includes("designroom") && !currentVideoData["link"]=="saved"){
            videoIntervals[projectId] = "interval";
        }
        let videoContainer = document.createElement('div');
        videoContainer.classList.add("draft__video");
        videoContainer.setAttribute('id', sortedVideoIDs[i]);
        var actionButtonContainer = document.createElement('div');
        var actionButtons = document.createElement('div');
        var customizeButton = document.createElement('button');
        var deleteButton = document.createElement('button');
        var downloadButton = document.createElement('button');
        var duplicateButton = document.createElement('button');
        let innerVideoContainer = document.createElement('div');
        innerVideoContainer.classList.add("inner-video-container");
        actionButtonContainer.setAttribute('style', 'display: flex; justify-content:center; margin-top: 0px;')
        actionButtons.setAttribute('style', 'width: 100%; display: flex; justify-content: center; align-items: center;')
        actionButtonContainer.setAttribute('style', 'width: 100%; display: flex; justify-content: center; align-items: center;')
        customizeButton.classList.add("customize-btn");
        deleteButton.classList.add('delete-btn');
        downloadButton.setAttribute('id', `download-${projectId}`);
        customizeButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: black; width: 90%; padding: 3%; margin: 2%; border-radius: 5px; border: 1px solid transparent;')
        deleteButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 1% 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;')
        downloadButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;');
        duplicateButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;');
        downloadButton.classList.add("download-btn");
        duplicateButton.classList.add('class', 'duplicate-btn')
        customizeButton.innerHTML = '<img src="/assets/img/draft/edit.webp">'
        deleteButton.innerHTML = '<img src="/assets/img/draft/delete.webp">'
        downloadButton.innerHTML = '<img src="/assets/img/draft/download.webp">';
        duplicateButton.innerHTML = '<img src="/assets/img/draft/duplicate.webp">';

        customizeButton.addEventListener('click', () => customizeVideo(sortedVideoIDs[i]));
        deleteButton.addEventListener('click', () => openConfirmationModal(sortedVideoIDs[i]));
        downloadButton.addEventListener('click', () => downloadVideo(sortedVideoIDs[i], currentVideoData["title"]));
        duplicateButton.addEventListener('click', () => duplicateVideo(sortedVideoIDs[i]));


        let p = document.createElement("p");
        p.classList.add("video-processing-tag");
        innerVideoContainer.append(p);
        if(currentVideoData["link"].includes("celebrare") || currentVideoData["link"].includes("designroom")){
            innerVideoContainer.style.background = "#00766330"
            downloadButton.removeAttribute("disabled");
            downloadButton.classList.remove("disabled-button");
            downloadButton.setAttribute("download-link",currentVideoData["link"]);
            p.innerText = "Completed";
        }else{
            innerVideoContainer.style.background = "#fefed4";
            if(currentVideoData["link"]!="saved" && currentVideoData["link"]!="An error occured"){
                videoIntervals[projectId] = currentVideoData["link"];
                p.innerText = currentVideoData["link"];
            }else{
                if(currentVideoData["link"]!="An error occured")
                    p.innerText = "No video has been created for this draft."
                else    
                    p.innerText = "An error occured"
                innerVideoContainer.style.background = "#ffd8d8";
            }
            downloadButton.setAttribute("disabled",true);
            downloadButton.classList.add("disabled-button");
        }
        if(currentVideoData["isContentUpdate"]){
            let p = document.createElement("div");
            p.classList.add("updated-content-icon");
            p.innerHTML = '<span class="material-symbols-outlined">update</span>';
            videoNameContainer.append(p);
        }
        actionButtonContainer.append(actionButtons);
        innerVideoContainer.append(videoNameContainer);
        videoContainer.append(innerVideoContainer);
        videoContainer.append(actionButtonContainer);
        actionButtons.appendChild(customizeButton)
        actionButtons.appendChild(duplicateButton);
        actionButtons.appendChild(deleteButton)
        actionButtons.appendChild(downloadButton)
        draftVideosContainer.append(videoContainer);
    }
    fetchInterval = setInterval(async ()=>{
        if(Object.keys(videoIntervals).length==0){
            clearInterval(fetchInterval);
            return;
        }
        let response = await db.collection("video_invite").doc("userCreatedVideos").collection("sampleVideo").doc(userId).get();
        response = await response.data();
        for(let i=0;i<Object.keys(videoIntervals).length;i++){
            let projectId = Object.keys(videoIntervals)[i]
            let data = response[projectId];
            let videoContainer = document.getElementById(projectId);
            let innerVideoContainer = videoContainer.querySelector(".inner-video-container")
            let downloadButton = videoContainer.querySelector(".download-btn");
            let p = videoContainer.querySelector(".video-processing-tag");
            if(!p){
                p = document.createElement("p");
                p.classList.add("video-processing-tag");
            }
            if(data["link"].includes("celebrare") || data["link"].includes("designroom") || data["link"]=="An error occured"){
                setTimeout(() => {
                    delete videoIntervals[projectId];
                    if(data["link"]=="An error occured"){
                        innerVideoContainer.style.background = "#ffd8d8"
                        p.innerText = "An error occured";
                    }else{
                        innerVideoContainer.style.background = "#00766330"
                        p.innerText = "Completed";
                        downloadButton.removeAttribute("disabled");
                        downloadButton.setAttribute("download-link",data["link"]);
                        downloadButton.classList.remove("disabled-button");
                    }
                }, 5000);
            }else{
                innerVideoContainer.style.background = "#fefed4";
                p.innerText = data["link"]
                downloadButton.setAttribute("disabled",true);
                downloadButton.classList.add("disabled-button");
            }
        }
    },10000)
}

function customizeVideo(id){
    window.location.href = "/video-invitation/videoEditingScreen?draftID="+id+"_"+userId;
}

function openConfirmationModal(draftId){
    document.getElementById('confirmation-modal').style.display = 'flex';
    document.getElementById('confirmation-modal-yes').onclick = function () {
        document.getElementById('confirmation-modal').style.display = 'none';
        deleteDraftVideo(draftId);
    };
}
function closeConfirmationModal() {
  document.getElementById('confirmation-modal').style.display = 'none';
}


async function deleteDraftVideo(draftId){
    try{
        document.getElementById("download-modal").style.display = "flex";
        document.getElementById("download-loader").style.display = "block";
        document.getElementById('noOfCards').innerHTML = "Deleting Video........"
        let deleteJSON = {
            userId: userId,
            projectId: draftId,
            type: "draft",
            designRoom: false
        }
        let response = await fetch("https://celebrare.cloud/deleteAssets",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deleteJSON)
        })
        if(response.status==200){
            document.getElementById(draftId).remove();
            if(document.querySelectorAll(".inner-video-container").length==0){
                document.querySelector(".video-empty-error").style.display = "block";
            }
            document.getElementById('noOfCards').innerHTML = "Your Video is Deleted."
            document.getElementById("download-loader").style.display = "none";
            document.getElementById("download-modal-close").style.display = "block";
        }else{
            showInternalServerError()
        }
    }catch(err){
        console.log(err)
        showInternalServerError()
    }
}

document.getElementById("download-modal-close").addEventListener("click",()=>{
    document.getElementById("download-modal-close").style.display = "none";
    document.getElementById("download-modal").style.display = "none";
})

function showInternalServerError(){
    document.getElementById("download-modal").style.display = "flex";
    if(document.getElementById("download-loader")) document.getElementById("download-loader").style.display = 'none';
    document.getElementById('noOfCards').innerHTML = "Internal Server Error";
    document.getElementById("download-modal-close").style.display = "block";
}

async function downloadVideo(id, name){
    try{
        document.getElementById("download-modal").style.display = "flex";
        document.getElementById("download-loader").style.display = "block";
        document.getElementById('noOfCards').innerHTML = "Downloading Video........"
        let videolink = document.getElementById(`download-${id}`).getAttribute("download-link");
        const response = await fetch(videolink);
        if(response.status!=200){
            showInternalServerError()
            return
        }
        const videoBlob = await response.blob();
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(new Blob([videoBlob]));
        downloadLink.download = name+'.mp4';
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        document.getElementById('noOfCards').innerHTML = "Your Video is Downloaded."
        document.getElementById("download-loader").style.display = "none";
        document.getElementById("download-modal-close").style.display = "block";
    }catch(err){
        showInternalServerError()
    }
}

async function duplicateVideo(projectId){
    try{
        document.getElementById("download-modal").style.display = "flex";
        if(document.getElementById("download-loader"))
            document.getElementById("download-loader").style.display = "block";
        document.getElementById('noOfCards').innerHTML = "Duplicating Video..."
        let duplicateJSON = {
            projectId: projectId,
            userId: userId,
            designRoom: false
        }
        let response = await fetch("https://celebrare.cloud/duplicateVideo",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(duplicateJSON)
        })
        if(response.status==200){
                response = await response.json();
                let projectId = response["projectId"];
                let currentVideoData = response;
                let videoNameContainer = document.createElement('div');
                if(currentVideoData["title"]){
                    videoNameContainer.classList.add("video-name");
                    videoNameContainer.innerHTML = currentVideoData["title"];
                }
                let videoContainer = document.createElement('div');
                videoContainer.classList.add("draft__video");
                videoContainer.setAttribute('id', projectId);
                var actionButtonContainer = document.createElement('div');
                var actionButtons = document.createElement('div');
                var customizeButton = document.createElement('button');
                var deleteButton = document.createElement('button');
                var downloadButton = document.createElement('button');
                var duplicateButton = document.createElement('button');
                let innerVideoContainer = document.createElement('div');
                innerVideoContainer.classList.add("inner-video-container");
                actionButtonContainer.setAttribute('style', 'display: flex; justify-content:center; margin-top: 0px;')
                actionButtons.setAttribute('style', 'width: 100%; display: flex; justify-content: center; align-items: center;')
                actionButtonContainer.setAttribute('style', 'width: 100%; display: flex; justify-content: center; align-items: center;')
                customizeButton.classList.add("customize-btn");
                customizeButton.setAttribute('onclick', `customizeVideo('${projectId}')`);
                deleteButton.classList.add('delete-btn');
                deleteButton.setAttribute(
                  'onclick',
                  `openConfirmationModal('${projectId}')`
                );
                downloadButton.setAttribute('id', `download-${projectId}`);
                downloadButton.setAttribute('onclick', `downloadVideo('${projectId}','${currentVideoData["title"]}')`);
                customizeButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: black; width: 90%; padding: 3%; margin: 2%; border-radius: 5px; border: 1px solid transparent;')
                deleteButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 1% 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;')
                downloadButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;');
                duplicateButton.setAttribute('style', 'cursor: pointer; display:block; background-color: white; color: white; width: 90%; padding: 3%;margin: 2%;border: 1px solid transparent; border-radius: 5px;');
                downloadButton.classList.add("download-btn");
                duplicateButton.classList.add('class', 'duplicate-btn')
                duplicateButton.setAttribute('onclick', `duplicateVideo('${projectId}')`)
                customizeButton.innerHTML = '<img src="/assets/img/draft/edit.webp">'
                deleteButton.innerHTML = '<img src="/assets/img/draft/delete.webp">'
                downloadButton.innerHTML = '<img src="/assets/img/draft/download.webp">';
                duplicateButton.innerHTML = '<img src="/assets/img/draft/duplicate.webp">';
                let p = document.createElement("p");
                p.classList.add("video-processing-tag");
                innerVideoContainer.append(p);
                innerVideoContainer.style.background = "#ffd8d8";
                p.innerText = "No video has been created for this draft."
                downloadButton.setAttribute("disabled",true);
                downloadButton.classList.add("disabled-button")
                actionButtonContainer.append(actionButtons);
                innerVideoContainer.append(videoNameContainer);
                videoContainer.append(innerVideoContainer);
                videoContainer.append(actionButtonContainer);
                actionButtons.appendChild(customizeButton)
                actionButtons.appendChild(duplicateButton);
                actionButtons.appendChild(deleteButton)
                actionButtons.appendChild(downloadButton)
                draftVideosContainer.append(videoContainer);
                document.getElementById('noOfCards').innerHTML = "Your Video is Duplicated Successfully.";
                if(document.getElementById("download-loader"))
                    document.getElementById("download-loader").style.display = "none";
                document.getElementById("download-modal-close").style.display = "block";
        }else{
            showInternalServerError();
        }
    }catch(err){
        console.log(err);
        showInternalServerError();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('confirmation-modal-close');
    
    if (closeButton) {
      closeButton.addEventListener('click', closeConfirmationModal);
    }
  
  });
