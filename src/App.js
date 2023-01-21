// App.js
import myEpicNft from "./utils/MyEpicNFT.json";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';

// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = 'nabe33';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/ja/assets/goerli/';
const TOTAL_MINT_COUNT = 3;
// スマートコントラクトがdeployされたアドレス
const CONTRACT_ADDRESS = "0x78F643E7ED77f4D476aF69b30302D90a1613B16d";

const App = () => {
  // ユーザのウォレットアドレスを格納するために使用する状態変数を遅疑
  const [currentAccount, setCurrentAccount] = useState("");
  console.log("currentAccount(must be empty @1st time): ", currentAccount);

  // tokenIDを画面表示に使えるようにする
  const [thisTokenId, setThisTokenId] = useState(0);

  // MyEpicNFT.solでeventがemitされた時に情報を受け取る
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT発行
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // eventがemitされる際にコントラクトから送信される情報を受け取る
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          setThisTokenId(tokenId.toNumber());
          alert(
            `あなたのウォレットにNFTを送信しました．OpenSeaに表示されるまで最大で10分かかることがあります．
            NFTへのリンクはこちらです： ${OPENSEA_LINK}${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        console.log("Setup event Listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ユーザが認証可能なウォレットアドレスを持っているか確認
  const checkIfWalletIsConnected = async () => {
    // ユーザがMetamaskを持っているか確認
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have Metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    // ユーザが認証可能なウォレットアドレスを持っている場合は，
    // ユーザに対してウォレットへのアクセス許可を求める．
    // 許可されれば，ユーザの最初のウォレットアドレスをaccountsに格納．
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authroized account: ", account);
      setCurrentAccount(account);
      // event Listener．この時点でユーザのウォレット接続は終わっている
      setupEventListener();
    } else {
      console.log("No authroized account found");
    }
  };

  // connectWallet メソッドを定義
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // ウォレットアドレスに対してアクセスをリクエスト
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      // ウォレットアドレスをcurrentAcoountに紐づけ
      setCurrentAccount(accounts[0]);
      // event Listener
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // NFTをMINTする関数
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log("nftTxn: ", nftTxn);
        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 「Connect to Wallet」を表示する関数
  const renderNotConnectedContainer = () => (
    <button 
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  // 「Mint NFT」を表示する関数
  const renderMintUI = () => (
    <button 
      onClick={askContractToMintNft} 
      className="cta-button connect-wallet-button"
    >
      Mint NFT
    </button>
  );

  // ページがロードされたときに useEffect()内の関数が呼び出されます
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">なべ's NFT Collection</p>
          <p className="sub-text">
            あなただけの特別なNFTをMintしよう（3個限定！）💫
          </p>
          {/* 条件付きレンダリング*/}
          {currentAccount === "" 
            ? renderNotConnectedContainer()
            : renderMintUI()}
        </div>
        <div className="mint-count">生成済みNFT数 {thisTokenId}/{TOTAL_MINT_COUNT}</div>
        <div className="mint-count"><a href={OPENSEA_LINK+CONTRACT_ADDRESS+"/"+thisTokenId}>OpenSeaでNFTコレクションを表示</a></div>
        
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
