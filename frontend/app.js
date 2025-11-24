const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // деплой на сеполии
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "string", "name": "passportPin", "type": "string"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "passportPin", "type": "string"}],
        "name": "calculateTokenId",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "citizen", "type": "address"}],
        "name": "hasPassport",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "passportPin", "type": "string"}],
        "name": "isPinUsed",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "citizen", "type": "address"},
            {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "passportPin", "type": "string"}
        ],
        "name": "PassportIssued",
        "type": "event"
    }
];

let web3;
let contract;
let userAccount;
document.addEventListener('DOMContentLoaded', () => {
    // Проверка загрузки Web3
    if (typeof Web3 === 'undefined') {
        alert('Ошибка: библиотека Web3 не загружена. Проверьте подключение к интернету.');
        return;
    }

    const connectBtn = document.getElementById('connect-btn');
    const mintForm = document.getElementById('mint-form');
    const passportPinInput = document.getElementById('passport-pin');

    connectBtn.addEventListener('click', connectWallet);
    mintForm.addEventListener('submit', handleMint);

    passportPinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().slice(0, 14);
    });
});


async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Пожалуйста, установите MetaMask или другой Web3 кошелек');
            return;
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            alert('Пожалуйста, разблокируйте ваш кошелек');
            return;
        }

        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        updateUI();
        checkPassportStatus();

    } catch (error) {
        console.error('Ошибка подключения:', error);
        showError('Не удалось подключить кошелек: ' + error.message);
    }
}

// Обновление UI после подключения
function updateUI() {
    document.getElementById('connect-btn').style.display = 'none';
    document.getElementById('wallet-info').style.display = 'block';
    document.getElementById('wallet-address').textContent = userAccount;
    document.getElementById('mint-form').style.display = 'block';
}

// Проверка статуса паспорта
async function checkPassportStatus() {
    try {
        const hasPassport = await contract.methods.hasPassport(userAccount).call();
        const statusEl = document.getElementById('passport-status');
        
        if (hasPassport) {
            statusEl.textContent = '✓ У вас уже есть паспорт SBT';
            statusEl.className = 'passport-status has-passport';
            document.getElementById('mint-form').style.display = 'none';
        } else {
            statusEl.textContent = 'У вас нет паспорта SBT';
            statusEl.className = 'passport-status no-passport';
        }
    } catch (error) {
        console.error('Ошибка проверки статуса:', error);
    }
}

// Обработка минта
async function handleMint(e) {
    e.preventDefault();

    const pinInput = document.getElementById('passport-pin');
    const passportPin = pinInput.value.trim();

    // Валидация
    if (passportPin.length !== 14) {
        showError('ПИН должен содержать 14 символов');
        return;
    }

    // Проверка, используется ли ПИН
    try {
        const pinUsed = await contract.methods.isPinUsed(passportPin).call();
        if (pinUsed) {
            showError('Этот ПИН уже используется');
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки ПИН:', error);
    }

    // Минт
    try {
        showLoading(true);
        hideMessages();

        const tx = await contract.methods.mint(passportPin).send({
            from: userAccount,
            gas: 200000
        });

        showLoading(false);
        showSuccess(tx.transactionHash);

        // Обновить статус
        setTimeout(() => {
            checkPassportStatus();
        }, 2000);

    } catch (error) {
        showLoading(false);
        handleError(error);
    }
}

// Показать успех
function showSuccess(txHash) {
    const resultSection = document.getElementById('result-section');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    resultSection.style.display = 'block';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';

    // Вычислить tokenId
    contract.methods.calculateTokenId(document.getElementById('passport-pin').value).call()
        .then(tokenId => {
            document.getElementById('token-id').textContent = tokenId.toString();
        })
        .catch(err => console.error('Ошибка вычисления tokenId:', err));

    // Ссылка на транзакцию (замените на ваш explorer)
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    const txLink = document.getElementById('tx-link');
    txLink.href = explorerUrl;
    txLink.textContent = txHash.substring(0, 20) + '...';
}

// Показать ошибку
function showError(message) {
    const resultSection = document.getElementById('result-section');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    resultSection.style.display = 'block';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
}

// Скрыть сообщения
function hideMessages() {
    document.getElementById('result-section').style.display = 'none';
}

// Показать/скрыть загрузку
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('mint-btn').disabled = show;
}

// Обработка ошибок
function handleError(error) {
    let errorMessage = 'Произошла ошибка';

    if (error.message) {
        if (error.message.includes('user rejected')) {
            errorMessage = 'Транзакция отклонена пользователем';
        } else if (error.message.includes('PinAlreadyUsed')) {
            errorMessage = 'Этот ПИН уже используется';
        } else if (error.message.includes('AddressAlreadyHasPassport')) {
            errorMessage = 'У вас уже есть паспорт SBT';
        } else if (error.message.includes('InvalidPinLength')) {
            errorMessage = 'Неверная длина ПИН (должно быть 14 символов)';
        } else {
            errorMessage = error.message;
        }
    }

    showError(errorMessage);
}

// Автоматическое подключение при изменении аккаунта
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            location.reload();
        } else {
            userAccount = accounts[0];
            if (web3 && contract) {
                updateUI();
                checkPassportStatus();
            }
        }
    });
}

