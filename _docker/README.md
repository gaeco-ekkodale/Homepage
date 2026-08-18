# Homepage Service

Der Homepage Service stellt die Startseite der Gaeco-Shell als Micro-Frontend bereit. Er zeigt eine
Getting-Started-Checkliste in vier Schritten und leitet den Status jedes Schritts live aus den
beteiligten Diensten ab (Guideline, Ontology, UseCase, Access, Instance). Es wird kein Fortschritt
gespeichert.

## Enthaltene Dienste

- **Homepage Client** (`homepage-client`) – React-Frontend, eingebunden unter dem Pfad `MOUNT_ROUTE`

## Besonderheit

Die Label-Id `app.mfe.id` **muss** die Zeichenfolge `homepage` enthalten. Der PluginHost erkennt das
Startseiten-Plugin per Substring-Match auf der Plugin-Id und rendert es unter der Route `/` anstelle
seiner eingebauten Startseite.

## Statusermittlung

Die Service-Hostnames sind optional. Ist einer nicht gesetzt, bleibt der betreffende Schritt auf
"status unknown" – Link und Erklärung werden weiterhin angezeigt. Ist ein Dienst gesetzt, aber nicht
erreichbar, wird das als "not reachable" ausgewiesen und nicht mit "noch nichts konfiguriert"
verwechselt.
