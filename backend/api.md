# API фронтенда

Все защищённые эндпоинты ожидают заголовок:

```http
Authorization: Bearer <jwt>
```

Если JWT отсутствует или бэк возвращает `401`, фронтенд сбрасывает локальную сессию и показывает экран авторизации.

## POST /auth/signin

Вход существующего пользователя.

### Request

```json
{
  "login": "anna",
  "password": "password"
}
```

### Response 200

```json
{
  "id": 1,
  "username": "anna",
  "login": "anna",
  "fullName": "Анна Смирнова",
  "token": "jwt-token"
}
```

### Response 401

```json
{
  "message": "Неверные данные авторизации"
}
```

## POST /auth/signup

Регистрация нового пользователя и выдача JWT.

### Request

```json
{
  "login": "new-user",
  "password": "password",
  "username": "new-user",
  "lastName": "Иванов",
  "firstName": "Иван"
}
```

### Response 201

```json
{
  "id": 17,
  "username": "new-user",
  "login": "new-user",
  "fullName": "Иванов Иван",
  "token": "jwt-token"
}
```

### Response 409

```json
{
  "message": "Логин или юзернейм уже заняты"
}
```

## GET /users

Возвращает всех пользователей системы для выбора участников.

### Response 200

```json
[
  {
    "id": 1,
    "username": "anna",
    "login": "anna",
    "fullName": "Анна Смирнова"
  }
]
```

### Response 401

```json
{
  "message": "Требуется авторизация"
}
```

## GET /meets

Возвращает все встречи. Фильтры по дню, неделе и "мои встречи" сейчас применяются на фронтенде.

### Response 200

```json
[
  {
    "id": 101,
    "topic": "Синхронизация продукта",
    "date": "2026-07-09",
    "participantIds": [1, 3, 8],
    "createdBy": 1,
    "createdAt": "2026-07-08T10:00:00.000Z"
  }
]
```

### Response 401

```json
{
  "message": "Требуется авторизация"
}
```

## POST /meets

Создаёт встречу. Бэк проверяет, что дата в будущем, участников не больше 15, и никто из участников не занят на выбранную дату.

### Request

```json
{
  "topic": "Планирование квартала",
  "participantIds": [1, 2, 3],
  "date": "2026-07-15"
}
```

### Response 201

```json
{
  "meet": {
    "id": 1700000000000,
    "topic": "Планирование квартала",
    "date": "2026-07-15",
    "participantIds": [1, 2, 3],
    "createdBy": 1,
    "createdAt": "2026-07-08T10:00:00.000Z"
  }
}
```

### Response 409

```json
{
  "conflicts": [2, 3]
}
```

### Response 401

```json
{
  "message": "Требуется авторизация"
}
```

## POST /auth/logout

Завершает сессию. На моках фронтенд просто удаляет JWT из `localStorage`.

### Response 204

Пустое тело ответа.
