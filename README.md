# TeleExpertAR

<p align="center">
  <img src="frontend/src/assets/homePage.png" alt="Architettura" width="900">
</p>

## Visione del Progetto 📌
**TeleExpert** AR è una piattaforma sperimentale di **teleassistenza** progettata per dimostrare l’integrazione di tecnologie di **comunicazione real-time**, streaming multimediale e analisi di segnali biometrici all’interno di un unico sistema distribuito basato su tecnologie web standard.  

## Architettura del Sistema 🏗️
Il progetto implementa un’**architettura client-server** in cui un soccorritore sul campo può trasmettere il flusso video della fotocamera del proprio smartphone a un medico remoto, consentendo un supporto operativo immediato durante situazioni di emergenza.

<p align="center">
  <img src="frontend/src/assets/structure.png" alt="Architettura" width="450">
</p>

### Comunicazione Real-Time
La comunicazione tra i dispositivi avviene tramite il protocollo **WebRTC**, che permette la trasmissione diretta di flussi audio e video con **bassa latenza**.  

Per consentire l’instaurazione della connessione tra i client è stato realizzato un **server di signaling** basato su **Node.js** e **WebSockets**, responsabile dello scambio delle informazioni di sessione necessarie alla negoziazione della connessione **peer-to-peer**. Questa architettura consente di separare la fase di coordinamento della comunicazione dalla trasmissione effettiva dei flussi multimediali.  

## Funzionalità Avanzate 🧬
Oltre alla trasmissione video, il sistema è stato progettato per supportare funzionalità avanzate di **monitoraggio e collaborazione remota**. In particolare, il progetto prevede l’estrazione di **parametri biometrici**, come il battito cardiaco, direttamente dal flusso video attraverso tecniche di **fotopletismografia (PPG)**, consentendo l’analisi in tempo reale di segnali fisiologici senza l’utilizzo di sensori esterni dedicati.  

<p align="center">
  <img src="frontend/src/assets/BPM_1.jpeg" alt="BPM" width="200">
</p>

L’**architettura modulare** del sistema consente inoltre l’integrazione di componenti avanzati, come un **media server WebRTC** per la gestione scalabile dei flussi multimediali e sistemi di **realtà aumentata collaborativa** per guidare visivamente le operazioni del soccorritore.  

## Conclusioni 🎯
Il progetto dimostra come l’utilizzo combinato di **protocolli web standard** e tecnologie di comunicazione real-time possa essere impiegato per sviluppare sistemi innovativi applicabili in contesti critici come la **telemedicina** e la **gestione delle emergenze**.

## Autrici 🖋️
Il progetto è stato sviluppato da:  
**Camilla D'Andria** M63001760  
**Serena Savarese** M63001855

## Guida all'uso 🚀
La piattaforma è ottimizzata per diverse modalità di accesso a seconda del ruolo operativo:  
* **Medico (Centrale Remota):** L'accesso deve avvenire tramite **PC/Laptop** utilizzando un browser (Chrome, Edge o Firefox). L'interfaccia desktop permette una visualizzazione dettagliata del flusso video e dei parametri biometrici analizzati.
* **Soccorritore (Sul Campo):** L'accesso deve avvenire tramite **Smartphone**. Una volta autorizzato l'accesso alla fotocamera, il sistema inizierà a trasmettere il flusso video e i dati biometrici alla centrale remota.

## WebSite 🌐
Per visualizzare il sito, cliccare al seguente link:
[Website](https://teleexpert.duckdns.org/)


## Licenza
Questo progetto è distribuito sotto la **Licenza MIT**. Consulta il file [LICENSE](LICENSE) per ulteriori dettagli.

