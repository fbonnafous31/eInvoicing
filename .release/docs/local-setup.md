# Mise en Place Locale Automatique — eInvoicing

Ce guide explique comment rendre l'application **eInvoicing** accessible **en local**, sous une adresse stable, **sans port**, et **démarrant automatiquement** à chaque allumage du PC sous Linux.

---

## 1) Ajouter une adresse locale stable

Édite le fichier `/etc/hosts` :

```bash
sudo nano /etc/hosts
```

Ajoute la ligne :

```
127.0.0.1    e-invoicing.local
```

Vérifie que ça fonctionne :

```bash
getent hosts e-invoicing.local
```

Tu pourras ensuite accéder à ton application via :

```
http://e-invoicing.local
```

---

## 2) Vérifier que Docker démarre automatiquement

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3) Créer un service systemd pour démarrer eInvoicing au boot

Créer le fichier :

```bash
sudo nano /etc/systemd/system/einvoicing.service
```

Y mettre :

```ini
[Unit]
Description=E-Invoicing local environment
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/home/TON_USER/chemin/vers/einvoicing
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

> Remplace `TON_USER/chemin/vers/einvoicing` par le chemin réel de ton projet.

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable einvoicing
sudo systemctl start einvoicing
```

Tester :

```bash
sudo reboot
```

Puis aller sur :

```
http://e-invoicing.local
```

---

## 4) (Optionnel mais conseillé) : URL sans port via Caddy

Caddy permet de **rediriger le trafic HTTP vers ton container** sans afficher le port 8080.

### 4.1 Installer Caddy

```bash
sudo apt install -y caddy
```

### 4.2 Configurer le reverse proxy

Édite le fichier Caddyfile :

```bash
sudo nano /etc/caddy/Caddyfile
```

Ajouter :

```
e-invoicing.local {
    reverse_proxy localhost:8080
    log {
        output file /var/log/caddy/einvoicing.log {
            roll_size 5mb
            roll_keep 2
            roll_keep_for 48h
        }
    }
}
```

### 4.3 Redémarrer Caddy

```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

⚠️ **Attention** : si Caddy échoue à démarrer, c’est souvent parce qu’un autre service (Apache, Nginx) écoute déjà sur le port 80. Vérifie avec :

```bash
sudo lsof -i :80
sudo systemctl stop apache2
```

Puis relance :

```bash
sudo systemctl restart caddy
```

### 4.4 Accéder à ton application

```
http://e-invoicing.local
```

---

## 5) Résultat Final ✅

| Fonction                         | Statut                            |
| -------------------------------- | --------------------------------- |
| Pas de serveur externe           | ✅ 100% local                      |
| Adresse stable                   | ✅ `e-invoicing.local`             |
| Démarrage automatique            | ✅ via `systemd`                   |
| Pas de port visible              | ✅ grâce à Caddy                   |
| Logging                          | ✅ `/var/log/caddy/einvoicing.log` |
| Aucune action à faire après boot | ✅ tout se lance seul              |

---

## 6) Pour résumer

1. Ajoute `e-invoicing.local` dans `/etc/hosts`.
2. Active Docker au démarrage.
3. Ajoute le service systemd pour Docker Compose.
4. (Optionnel) Installe et configure Caddy pour supprimer le port dans l’URL.
5. **Redémarre → l’application est prête** 🎉

---

💡 **Tips pour la prochaine fois :**

* Toujours vérifier `/etc/hosts` + DNS avec `getent hosts`.
* Assurer que **Caddy n’est pas bloqué par un autre serveur**.
* Garder les logs Caddy pour diagnostiquer les problèmes (`/var/log/caddy/einvoicing.log`).
