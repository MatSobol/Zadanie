### Wersja
Program działa poprawnie z Node.js w wersji 20.12.2.
### Instrukcje uruchomienia
wpisz:
```
npm install
node program.js
```
domyślnie program korzysta z protokołu tcp do pingowania, ponieważ protokół icmp jest blokowany przez firewall. Jeśli chcesz użyć protokołu icmp zmień linijke 2 w pliku program.js na:
```
const { ping } = require("./icmpPing.js");
 ```
