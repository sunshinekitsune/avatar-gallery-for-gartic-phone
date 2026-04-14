// ==UserScript==
// @name         Gartic Phone Avatar Gallery
// @namespace    http://tampermonkey.net/
// @version      2026-04-13
// @description  Adds a avatar gallery to Gartic Phone!
// @author       sunshinekitsune
// @license      GNU General Public License v3.0
// @match        *://garticphone.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garticphone.com
// @run-at       document-start
// @grant        GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/573847/Gartic%20Phone%20Avatar%20Gallery.user.js
// @updateURL https://update.greasyfork.org/scripts/573847/Gartic%20Phone%20Avatar%20Gallery.meta.js
// ==/UserScript==

(async function() {
    "use strict";

    GM_addStyle(`
    .avatar-select-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        background-image: linear-gradient(215deg, rgb(60, 40, 125, 65%) 0%, rgb(60, 9, 85, 65%) 85%);
        padding: 4vmin;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        border: 0.5625vmin rgba(29,29,27,.15)solid;
        box-shadow: inset 0vmin 0.28125vmin 0vmin 0vmin rgba(255,255,255,.15),0vmin 0.421875vmin 0vmin 0vmin rgba(255,255,255,.15);
        border-radius: 1.6875vmin;

        transition: opacity 0.3s ease, transform 0.3s ease;
        will-change: transform, opacity;
        backface-visibility: hidden;
        z-index: 9999;
    }

    .avatar-select-container-disable {
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -45%) scale(0.95);
    }

    .avatar-select-header {
        padding-bottom: 2vmin;
        font-family: "Black";
        text-transform: uppercase;
        font-size: 4.5vmin;
        letter-spacing: 0.500625vmin;
        color: #FFFFFF;
        text-shadow: rgb(42,1,81)0.5625vmin 0vmin 0vmin,rgb(42,1,81)0.4936415625vmin 0.26967684375vmin 0vmin,rgb(42,1,81)0.30391875vmin 0.473326875vmin 0vmin,rgb(42,1,81)0.0397895625vmin 0.5610909375vmin 0vmin,rgb(42,1,81)-0.2340826875vmin 0.5114784375vmin 0vmin,rgb(42,1,81)-0.4506440625vmin 0.336639375vmin 0vmin,rgb(42,1,81)-0.556869375vmin 0.07938vmin 0vmin,rgb(42,1,81)-0.5267559375vmin -0.1973154375vmin 0vmin,rgb(42,1,81)-0.3676753125vmin -0.4257vmin 0vmin,rgb(42,1,81)-0.11857275vmin -0.549860625vmin 0vmin,rgb(42,1,81)0.159559875vmin -0.5393953125vmin 0vmin,rgb(42,1,81)0.398626875vmin -0.39686625vmin 0vmin,rgb(42,1,81)0.540095625vmin -0.15717121875vmin 0vmin;
    }

    .avatar-icons-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1vmin;
        width: calc(10vmin * 10);
    }

    .avatar-icons-grid-entry {
        box-sizing: border-box;
        display: flex;
        align-items: flex-end;
        justify-content: center;

        width: 9vmin;
        height: 9vmin;

        border: 0.4vmin #FFFFFF solid;
        border-radius: 50%;
        margin: 0;

        transition: transform 0.2s ease;
    }

    .avatar-icons-grid-entry:hover {
        transform: scale(1.2);
    }

    .avatar-icons-grid-entry img {
        margin: 0 0 0.15vmin;
        width: 90%;
        height: 110%;
        display: block;
        object-fit: cover;
        cursor: pointer;
        image-rendering: optimizeSpeed;
    }

    .avatar-display {
        cursor: pointer;
    }
    `);

    function nullishAync(callback, id = "") {
        if (id.length > 0) {
            console.log("Waiting for " + id);
        }
        return new Promise(function (resolve) {
            function attempt() {
                const result = callback();
                if (result) {
                    if (id.length > 0) {
                        console.log(id + " found!");
                    }
                    resolve(result);
                } else {
                    setTimeout(attempt, 50);
                }
            }
            attempt();
        });
    }

    console.log("Fetching avatars...");
    const avatars = [];
    let ticker = 0;
    while (true) {
        const url = `https://garticphone.com/images/avatar/${ticker}.svg`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                break;
            }
            // const data = await response.text();
            // const blob = new Blob([data], { type: "image/svg+xml" });
            const img = document.createElement("img");
            img.setAttribute("draggable", false);
            // img.src = URL.createObjectURL(blob);
            img.src = url;
            avatars.push({
                id: ticker,
                url: url,
                img: img
            });
            ticker++;
        } catch (err) {
            console.error("Failed due to network error:", err);
            break;
        }
    }
    console.log(`${avatars.length} have been found!`);

    const avatarSelectContainer = document.createElement("div");
    avatarSelectContainer.classList.add("avatar-select-container", "avatar-select-container-disable");

    const avatarSelectHeader = document.createElement("span");
    avatarSelectHeader.classList.add("avatar-select-header");
    avatarSelectContainer.appendChild(avatarSelectHeader);
    avatarSelectHeader.textContent = "AVATAR GALLERY";

    const avatarIconsContainer = document.createElement("div");
    avatarIconsContainer.classList.add("avatar-icons-grid");
    avatarSelectContainer.appendChild(avatarIconsContainer);

    let blockSwitch = false;
    let switchToAvatarMethod = null;
    avatars.forEach(avatar => {
        const container = document.createElement("diV");
        container.classList.add("avatar-icons-grid-entry");
        container.appendChild(avatar.img);

        avatarIconsContainer.appendChild(container);
        avatar.img.addEventListener("click", async () => {
            if (!blockSwitch && switchToAvatarMethod && !avatarSelectContainer.classList.contains("avatar-select-container-disable")) {
                await switchToAvatarMethod(avatar.id);
                avatarSelectContainer.classList.add("avatar-select-container-disable");
            }
        });
    });

    document.body.appendChild(avatarSelectContainer);

    async function inject() {
        console.log("Injecting");

        document.querySelector(".side")?.remove();

        const handleAvatarContainer = await nullishAync(() => document.querySelector(".handle-avatar"), "avatar container");
        handleAvatarContainer.style.display = "none";

        const handleAvatarButton = await nullishAync(() => handleAvatarContainer.children[0].children[0], "handle avatar button");
        const reactPropKey = await nullishAync(() => Object.keys(handleAvatarButton).filter(k => k.startsWith("__reactProps"))[0], "react prop key");
        const handleAvatarButtonProp = handleAvatarButton[reactPropKey];
        const handleAvatarClick = handleAvatarButtonProp.onClick;

        const avatarDisplay = await nullishAync(() => handleAvatarContainer.parentElement.children[0], "avatar display");
        avatarDisplay.classList.add("avatar-display");
        avatarDisplay.addEventListener("click", function () {
            avatarSelectContainer.classList.remove("avatar-select-container-disable");
        });

        const contentBody = await nullishAync(() => document.getElementById("content"), "content body");
        contentBody.addEventListener("click", function (event) {
            if (event.target === event.currentTarget) {
                avatarSelectContainer.classList.add("avatar-select-container-disable");
            }
        });

        // I think there is only 1 h4 lmao i hope
        const chooseText = await nullishAync(() => document.querySelector("h4"), "choose text");
        chooseText.textContent = "<--\nTAP THE AVATAR TO SWITCH IT";
        chooseText.style.whiteSpace = "pre-wrap";

        const _getAvatarIDFromURLRegex = /avatar\/(\d+)\.svg/;
        function getAvatarIDFromURL(url) {
            const result = url.match(_getAvatarIDFromURLRegex);
            return result ? parseInt(result[1], 10) : null;
        }

        function getCurrentAvatarURL() {
            return getComputedStyle(avatarDisplay).backgroundImage;
        }

        switchToAvatarMethod = id => {
            blockSwitch = true;
            return new Promise(function (resolve) {
                if (getAvatarIDFromURL(getCurrentAvatarURL()) === id) {
                    resolve();
                } else {
                    const observer = new MutationObserver(function () {
                        if (!handleAvatarButton.isConnected || getAvatarIDFromURL(getCurrentAvatarURL()) === id) {
                            observer.disconnect();
                            blockSwitch = false;
                            resolve();
                        } else {
                            handleAvatarClick();
                        }
                    });
                    observer.observe(avatarDisplay.parentElement, {
                        attributes: true,
                        childList: true,
                        subtree: true
                    });
                    handleAvatarClick();
                }
            });
        }
    }

    if (document.readyState === "complete") {
        inject();
    } else {
        window.addEventListener("load", () => inject());
    }

    setInterval(function () {
        const menuButton = document.querySelector(".button-line.button-back");
        if (menuButton && !menuButton.getAttribute("avatar_menu_injected")) {
            menuButton.setAttribute("avatar_menu_injected", true);
            menuButton.addEventListener("click", () => inject());
        }
    }, 100);
})();