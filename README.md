# SC4053 Blockchain Technology Group ReverseOreo: '.ntu Auction House'

Welcome to the repository of Group ReverseOreo: .ntu Auction House 

Our group consist of  **Kassim**, **Elijah**, and **Alexx**, and  we have implemented a Decentralized Domain Registrar that allows users on the Ethereum Network to bid for unregistered domain names .

The Decentralized Domain Registrar, titled **'.ntu Auction House'**, , an innovative decentralized DNS registrar built on the Ethereum blockchain. I'm excited to walk you through the features and functionality of our web application. At .ntu Auction House, our goal is to provide a seamless and transparent auction experience for users looking to bid on and acquire unique domain names.


## Contents
* [Setting Up Environment](#Environment)
  * [0. Setting Up Pre-Requisites](#PreReqs)
  * [1. Setting up Project Directory](#Directory)
  * [2. Setting Up using the Remix Environment](#RemixIDE)
  * [3.  Setting Up the React Front End Web Application](#FrontEnd)
 


<a name="Environment"></a>
## Setting Up Environment

<a name="PreReqs"></a>
### 0. Setting up Pre-Requisites

Do ensure that the following are installed first:

* NodeJS - can be installed [from this link](https://nodejs.org/en/).
* npm - can be installed [from this link](https://www.npmjs.com/get-npm).
* Metamask Google Chrome Extension - can be installed [from this link](https://metamask.io/download.html).


<a name="Directory"></a>
### 1. Setting up Project Directory

To use our App, you will first need to clone the repository to your local computer. You may do so in your own desired local directory with the following command

```bash
git clone https://github.com//kassimmalaysia/SC4053.git
```



<a name="RemixIDE"></a>
### 2. Setting Up using the Remix Environment

#### 2.1 Linking of Metamask to the Remix-EtheruemIDE
Once you have installed Metamask. You will have to create accounts in the Test Network.

![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/24181b05-2f1b-45fe-82cd-97a9b7b9051c)
After you have created a account, select Sepolia network

![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/7c88e66f-7605-4195-8f33-598d089572e6)

To get free ether, please visit https://sepoliafaucet.com/


#### 2.2 Deploying with Remix-Ethereum IDE

Go to https://remix.ethereum.org/.
![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/41c2b5af-e0cc-49a3-8be4-288b34cddf96)
under test, right-click on it and upload the smart contract which can be found under the Contract Folder

![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/9fdf7043-07fa-4928-a627-88ded151739d)

Click on compile to compile the contract


![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/d4f8ea6f-a9f6-43dd-9358-f29bcaa622d6)


Select the Injected Environment to connect Metamask to Remix. Click on Deploy .During the Deployment, take note of the contract address obtained after deploying the Dns Solidity contract.

![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/6b700f88-d716-4be8-84d6-2b08a6d6d992)




<a name="FrontEnd"></a>
## Setting Up the React Front End Web Application

Execute the following commands to initialise the React Web Application.

```bash
npm install
```

Once that is done, we can run the web application on (http://localhost:3000/)  using the following command:



```bash
npm run start
```


We are finally ready to navigate around the Front End Website!
![image](https://github.com/kassimmalaysia/SC4053/assets/101180214/7d791ddd-4c24-4738-af7c-21e17dba2eac)





