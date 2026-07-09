import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, getStoredUser, getTodayValue } from "./api";
import type { ApiError, AuthUser, Meet, TimeFilterMode, User } from "./types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

const getWeekBounds = (dateValue: string) => {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
};

const userLabel = (user?: User) => (user ? `${user.fullName} @${user.username}` : "Неизвестный");

const getParticipantIds = (meet: Meet) => meet.meet_users.map((meetUser) => meetUser.user_id);

function AuthPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const user =
        mode === "signin"
          ? await api.signIn({ login, password })
          : await api.signUp({
              login,
              password,
              username,
              fullName: `${lastName.trim()} ${firstName.trim()}`.trim(),
            });
      onLogin(user);
    } catch (error) {
      setError((error as ApiError).message ?? "Не удалось авторизоваться");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <div>
          <p className="eyebrow">Календарь встреч</p>
          <h1>{mode === "signin" ? "Вход в систему" : "Регистрация"}</h1>
        </div>
        <div className="segmented auth-tabs">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>
        <label>
          Логин
          <input value={login} onChange={(event) => setLogin(event.target.value)} required />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {mode === "signup" ? (
          <>
            <div className="name-grid">
              <label>
                Фамилия
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>
              <label>
                Имя
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Юзернейм
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
          </>
        ) : null}
        {error ? <p className="error-text auth-error">{error}</p> : null}
        <button className="primary-button" disabled={isLoading}>
          {isLoading ? "Подождите..." : mode === "signin" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>
    </main>
  );
}

function CreateMeetModal({
  users,
  currentUser,
  existingMeets,
  onClose,
  onCreated,
}: {
  users: User[];
  currentUser: AuthUser;
  existingMeets: Meet[];
  onClose: () => void;
  onCreated: (meet: Meet) => void;
}) {
  const [step, setStep] = useState<"participants" | "date">("participants");
  const [topic, setTopic] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([currentUser.id]);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [conflictIds, setConflictIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateValue = useMemo(() => {
    if (!day || !month || !year) {
      return "";
    }
    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }, [day, month, year]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.fullName, user.username, user.login].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [userSearch, users]);

  const toggleUser = (id: number) => {
    setConflictIds((ids) => ids.filter((conflictId) => conflictId !== id));
    setSelectedIds((ids) => {
      if (ids.includes(id)) {
        return id === currentUser.id ? ids : ids.filter((item) => item !== id);
      }
      if (ids.length >= 15) {
        return ids;
      }
      return [...ids, id];
    });
  };

  const goNext = () => {
    if (topic.trim().length < 3) {
      setError("Укажите тему встречи");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Выберите участников");
      return;
    }
    setError("");
    setStep("date");
  };

  const submit = async () => {
    const parsedDate = new Date(`${dateValue}T12:00:00`);
    if (!dateValue || Number.isNaN(parsedDate.getTime()) || dateValue <= getTodayValue()) {
      setError("Выберите дату в будущем");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setConflictIds([]);
    try {
      const meet = await api.createMeet({
        topic,
        date: dateValue,
        participantIds: selectedIds,
      });
      onCreated(meet);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 409) {
        const conflictIds = apiError.conflicts ?? apiError.detail?.conflicts ?? [];
        const conflictUserIds = existingMeets
          .flatMap((meet) => meet.meet_users)
          .filter((meetUser) => conflictIds.includes(meetUser.id))
          .map((meetUser) => meetUser.user_id);
        setConflictIds(conflictUserIds);
        setStep("participants");
        setError("У выделенных красным участников уже есть встреча на эту дату");
      } else {
        setError(apiError.message ?? "Не удалось создать встречу");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Новая встреча</p>
            <h2>{step === "participants" ? "Тема и участники" : "Дата встречи"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        {step === "participants" ? (
          <div className="modal-content">
            <label>
              Тема
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Например, Планирование квартала"
              />
            </label>
            <div>
              <div className="section-line">
                <strong>Участники</strong>
                <span>{selectedIds.length}/15</span>
              </div>
              <label className="search-field">
                Поиск сотрудника
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Имя, username или логин"
                />
              </label>
              {filteredUsers.length === 0 ? (
                <div className="search-empty">Сотрудники не найдены</div>
              ) : (
                <div className="user-grid">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedIds.includes(user.id);
                    const isConflict = conflictIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        className={[
                          "user-chip",
                          isSelected ? "selected" : "",
                          isConflict ? "conflict" : "",
                        ].join(" ")}
                        onClick={() => toggleUser(user.id)}
                        type="button"
                      >
                        <span>{user.fullName}</span>
                        <small>@{user.username}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="modal-content">
            <div className="date-grid">
              <label>
                День
                <input
                  inputMode="numeric"
                  maxLength={2}
                  value={day}
                  onChange={(event) => setDay(event.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="ДД"
                />
              </label>
              <label>
                Месяц
                <input
                  inputMode="numeric"
                  maxLength={2}
                  value={month}
                  onChange={(event) =>
                    setMonth(event.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  placeholder="ММ"
                />
              </label>
              <label>
                Год
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={year}
                  onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="ГГГГ"
                />
              </label>
            </div>
          </div>
        )}

        {error ? <p className="error-text">{error}</p> : null}

        <div className="modal-actions">
          {step === "date" ? (
            <button className="secondary-button" onClick={() => setStep("participants")}>
              Назад
            </button>
          ) : null}
          <button className="primary-button" onClick={step === "participants" ? goNext : submit}>
            {step === "participants" ? "Далее" : isSubmitting ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingsPage({
  currentUser,
  onUnauthorized,
  onLogout,
}: {
  currentUser: AuthUser;
  onUnauthorized: () => void;
  onLogout: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [showMine, setShowMine] = useState(false);
  const [mode, setMode] = useState<TimeFilterMode>("day");
  const [selectedDate, setSelectedDate] = useState(getTodayValue());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedUsers, loadedMeets] = await Promise.all([api.getUsers(), api.getMeets()]);
        setUsers(loadedUsers);
        setMeets(loadedMeets);
      } catch (error) {
        if ((error as ApiError).status === 401) {
          onUnauthorized();
        }
      }
    };
    load();
  }, [onUnauthorized]);

  const filteredMeets = useMemo(() => {
    const week = getWeekBounds(selectedDate);
    return meets.filter((meet) => {
      const inTime =
        mode === "day"
          ? meet.date === selectedDate
          : meet.date >= week.from && meet.date <= week.to;
      const inMine = !showMine || getParticipantIds(meet).includes(currentUser.id);
      return inTime && inMine;
    });
  }, [currentUser.id, meets, mode, selectedDate, showMine]);

  const myMeets = useMemo(
    () => meets.filter((meet) => getParticipantIds(meet).includes(currentUser.id)),
    [currentUser.id, meets],
  );

  const created = (meet: Meet) => {
    setMeets((items) => [...items, meet].sort((left, right) => left.date.localeCompare(right.date)));
    setIsModalOpen(false);
  };

  const logout = async () => {
    await api.logout();
    onLogout();
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Компания</p>
          <h1>Календарь встреч</h1>
        </div>
        <div className="profile">
          <span>{userLabel(currentUser)}</span>
          <button className="secondary-button" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <section className="toolbar">
        <div className="segmented">
          <button className={mode === "day" ? "active" : ""} onClick={() => setMode("day")}>
            День
          </button>
          <button className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>
            Неделя
          </button>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showMine}
            onChange={(event) => setShowMine(event.target.checked)}
          />
          Только мои
        </label>
        <button className="primary-button push-right" onClick={() => setIsModalOpen(true)}>
          Создать встречу
        </button>
      </section>

      <div className="content-grid">
        <section className="meet-list" aria-label="Все встречи">
          {filteredMeets.length === 0 ? (
            <div className="empty-state">Встреч на выбранный период нет</div>
          ) : (
            filteredMeets.map((meet) => (
              <article className="meet-card" key={meet.id}>
                <div>
                  <p className="meet-date">{formatDate(meet.date)}</p>
                  <h2>{meet.topic}</h2>
                </div>
                <div className="participants">
                  {getParticipantIds(meet).map((id) => (
                    <span key={id}>{userLabel(userMap.get(id))}</span>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="my-meets-panel" aria-label="Все мои встречи">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Личное окно</p>
              <h2>Все мои встречи</h2>
            </div>
            <span>{myMeets.length}</span>
          </div>
          <div className="my-meets-list">
            {myMeets.length === 0 ? (
              <p className="panel-empty">У вас пока нет встреч</p>
            ) : (
              myMeets.map((meet) => (
                <article className="mini-meet-card" key={meet.id}>
                  <p>{formatDate(meet.date)}</p>
                  <h3>{meet.topic}</h3>
                  <span>{getParticipantIds(meet).length} участников</span>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      {isModalOpen ? (
        <CreateMeetModal
          users={users}
          currentUser={currentUser}
          existingMeets={meets}
          onClose={() => setIsModalOpen(false)}
          onCreated={created}
        />
      ) : null}
    </main>
  );
}

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());

  if (!currentUser) {
    return <AuthPage onLogin={setCurrentUser} />;
  }

  return (
    <MeetingsPage
      currentUser={currentUser}
      onUnauthorized={() => setCurrentUser(null)}
      onLogout={() => setCurrentUser(null)}
    />
  );
}
