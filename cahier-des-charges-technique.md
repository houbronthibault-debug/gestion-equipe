# Site de gestion d'équipe de club — Cahier des charges technique

## 1. Contexte

Site pour un club multi-équipes, avec un espace propre par équipe (événements + documents),
des joueurs pouvant appartenir à plusieurs équipes, et une gestion de rôles cumulables.
Club unique (pas de multi-tenant).

## 2. Rôles

| Rôle | Portée | Attribué par |
|---|---|---|
| Administrateur | Global | Existant par défaut / autre admin |
| Membre du bureau | Global | Admin |
| Coach | Par équipe | Admin |
| Joueur | Par équipe | Coach de l'équipe, Admin |
| Capitaine | Par événement (doit être membre de l'équipe organisatrice) | Coach de l'équipe, Admin |
| Intendant | Par événement (doit être membre de l'équipe organisatrice) | Coach de l'équipe, Admin |

L'administrateur peut toujours agir à la place de n'importe quel rôle.

## 3. Modèle de données (entités principales)

- **Utilisateur** : id, nom_prenom, pseudo, mail, telephone, mot_de_passe_hash, est_admin, est_membre_bureau
- **Equipe** : id, nom
- **Appartenance** (Utilisateur ↔ Equipe) : role (Coach | Joueur)
- **Evenement** : id, equipe_id, type (entrainement | stage | match_amical | championnat | tournoi), lieu, duree, programme, objectif
- **Assignation_evenement** (Utilisateur ↔ Evenement) : role (Capitaine | Intendant) — contrainte applicative : l'utilisateur doit être dans `Appartenance` pour l'équipe organisatrice
- **Participation** (Utilisateur ↔ Evenement) : statut_presence (en_attente | confirme | infirme), infos_intendance_ok (booléen)
- **Document** : id, equipe_id (nullable), visible_club (booléen), depose_par, fichier_ou_lien, type

## 4. Règles de permission

| Action | Qui peut le faire |
|---|---|
| Ajouter/retirer un joueur de l'équipe | Coach de l'équipe, Admin |
| Créer un événement pour l'équipe | Coach de l'équipe, Admin |
| Désigner capitaine/intendant sur un événement | Coach de l'équipe organisatrice, Admin |
| Modifier programme/lieu/objectif de l'événement | Coach, Admin |
| Éditer l'espace capitaine de l'événement | Capitaine désigné, Admin |
| Éditer trajet/couchage/repas/règlement | Intendant désigné, Admin |
| Confirmer/infirmer sa présence, remplir ses infos | Le joueur concerné |
| Déclencher une relance manuelle aux retardataires | Coach ou intendant de l'événement, Admin |
| Valider une inscription au club | Admin |
| Déposer un document d'équipe | Coach de l'équipe, Admin |
| Déposer un document "visible club" | Tout coach, Membre du bureau, Admin |
| Consulter un document "visible club" | Tous les membres du club |
| Consulter un document d'équipe | Membres de cette équipe uniquement |

## 5. Notifications

- Notification à la création d'un événement (aux invités par défaut : membres de l'équipe)
- Notification lors de l'ajout à un événement
- Relance **manuelle** (pas automatique) : le coach ou l'intendant de l'événement déclenche
  l'envoi d'une notification uniquement aux participants n'ayant pas réalisé l'action attendue
  (confirmation de présence ou remplissage des infos d'intendance)

## 6. Stack technique retenue

| Couche | Choix |
|---|---|
| Framework | Next.js (TypeScript) |
| Base de données | PostgreSQL (Neon ou Supabase, tier gratuit) |
| ORM | Prisma |
| Authentification | Auth.js (NextAuth), identifiant + mot de passe |
| Stockage fichiers | Supabase Storage ou Cloudflare R2 |
| Emails | Resend |
| Hébergement | Vercel |

Contraintes du tier gratuit : stockage vidéo limité (privilégier liens externes si volumineux),
taille de base de données limitée (~0.5-1 Go), volume d'emails/jour limité.

## 7. Arborescence des pages

### Public (non connecté)
- Connexion
- Demande d'inscription (passe en attente de validation admin)

### Communes (connecté)
- Tableau de bord : calendrier unifié toutes équipes confondues, actions en attente, notifications
- Mes équipes
- Documents du club (visible club)
- Mon profil

### Espace équipe (membres de l'équipe)
- Vue d'ensemble (calendrier équipe, liste des membres)
- Documents de l'équipe
- Détail d'un événement :
  - Infos générales (éditable coach/admin)
  - Liste des participants + statuts
  - Confirmation de présence (joueur concerné)
  - Espace capitaine (éditable capitaine désigné/admin)
  - Espace intendance (éditable intendant désigné/admin, chaque joueur remplit ses infos)
  - Bouton "relancer les retardataires" (coach/intendant/admin)

### Gestion équipe (coach + admin)
- Gestion des membres
- Création d'événement
- Désignation capitaine/intendant
- Dépôt de documents (équipe ou club)

### Back-office admin
- Validation des inscriptions
- Gestion globale des rôles
- Gestion des équipes
- Gestion des utilisateurs

## 8. Points encore ouverts

- Durée par défaut / créneaux récurrents pour les entraînements ?
- Format exact des rappels (email seul, ou notification in-app également) ?
- Suppression de compte / RGPD : process à définir avant mise en production
