const currentScore = document.getElementById("current-score");
const bestScore = document.getElementById("best-score");
const guiWidth = document.getElementById("gui").offsetWidth;
const playField = document.getElementById("play-field");
const playButton = document.getElementById("play-button");
const exitButton = document.getElementById("exit-button");
const modeForm = document.querySelector("form");
const borderWidth =
  parseInt(window.getComputedStyle(playField).borderWidth) * 2; // Учитываем обе стороны
const availableWidth = window.innerWidth - guiWidth - borderWidth; // Доступная ширина
const availableHeight = window.innerHeight - borderWidth; // Доступная высота

let gameMode = "classic";
let app;
let walls = [];

const START_LENGTH = 2;
const CELL_SIZE = 30;
const FIELD_SIZE = initializeGame();

function initializeGame() {
  // Удаляем предыдущее приложение, если оно существует
  if (app) {
    app.destroy(true, { children: true });
    playField.innerHTML = ""; // Убедитесь, что поле очищается от старого canvas
  }

  walls.forEach((wall) => {
    app.stage.removeChild(wall); // Удаляем каждый объект стены с игровой сцены
  });
  walls = []; // Очищаем массив стен

  // Рассчитываем доступные размеры
  const availableWidth = window.innerWidth - guiWidth - borderWidth; // Доступная ширина
  const availableHeight = window.innerHeight - borderWidth; // Доступная высота

  // 2. Рассчитываем размер поля
  // Размер одной клетки в пикселях
  const FIELD_SIZE_X = Math.floor(availableWidth / CELL_SIZE); // Количество клеток по ширине
  const FIELD_SIZE_Y = Math.floor(availableHeight / CELL_SIZE); // Количество клеток по высоте

  // 3. Устанавливаем значения для поля
  const FIELD_SIZE = {
    x: FIELD_SIZE_X,
    y: FIELD_SIZE_Y,
  };

  // Создаем новое приложение PIXI
  app = new PIXI.Application({
    width: availableWidth, // Подстраиваем ширину с учетом GUI и границы
    height: availableHeight, // Подстраиваем высоту с учетом границы
    backgroundColor: 0x1099bb,
  });

  // Добавляем только один раз
  document.getElementById("play-field").appendChild(app.view);

  return FIELD_SIZE;
}

// Обработчик для изменения режима
modeForm.addEventListener("change", (event) => {
  if (event.target.name === "mode") {
    if (event.target.value === "god") {
      console.log("FFFF");
      playField.style.border = "none"; // Убираем границы

      // Устанавливаем значения для приложения на весь экран
      app.renderer.resize(window.innerWidth - guiWidth, window.innerHeight + 1);
      // initializeGame();
    } else {
      // Возвращаем границы
      playField.style.border = "50px solid #553131";

      // Переинициализируем игру с учетом границ и GUI
      initializeGame(); // Переинициализация игры
    }
  }
});

// 3. Класс для управления GUI (текущим и лучшим счётом, меню).
class GUI {
  constructor() {
    this.bestScore = 0; // Лучший счёт, сохранённый между играми.
    this.currentScore = 0; // Текущий счёт.
    this.setup(); // Инициализация GUI.
  }

  setup() {}

  updateScore(newScore) {
    this.currentScore = newScore; // Обновляем текущий счет
    currentScore.textContent = this.currentScore; // Обновляем элемент на странице

    if (this.currentScore > this.bestScore) {
      this.bestScore = this.currentScore; // Обновляем лучший счет
      bestScore.textContent = this.bestScore; // Отображаем лучший счет на странице
    }
  }

  // Показ меню.
  showMenu() {
    alert("Pause Menu"); // Простое всплывающее меню.
  }
}

// 4. Класс для еды, которую должна собирать змея.
class Food {
  constructor(snake) {
    this.snake = snake; // Сохраняем ссылку на змею.
    this.food = new PIXI.Graphics();
    this.food.beginFill(0xff0000);
    this.food.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
    this.food.endFill();
    this.spawn();
    app.stage.addChild(this.food);
  }

  // Спавн еды в случайной клетке на поле.
  // Спавн еды в случайной клетке на поле.
  // Обновлённый метод спавна еды с проверкой на присутствие змеи.
  spawn() {
    if (!FIELD_SIZE || !this.snake) {
      console.error("FIELD_SIZE или snake не инициализированы");
      return;
    }

    let validPosition = false;

    while (!validPosition) {
      const randomX = Math.floor(Math.random() * FIELD_SIZE.x) * CELL_SIZE;
      const randomY = Math.floor(Math.random() * FIELD_SIZE.y) * CELL_SIZE;

      validPosition =
        !this.snake.segments.some(
          (segment) => segment.x === randomX && segment.y === randomY
        ) && !walls.some((wall) => wall.x === randomX && wall.y === randomY);

      if (validPosition) {
        this.food.x = randomX;
        this.food.y = randomY;
      }
    }
  }
}

// 5. Класс для змеи.
class Snake {
  constructor() {
    this.segments = []; // Массив сегментов змеи.
    this.direction = "right"; // Начальное направление движения.
    this.isAlive = true; // Статус жизни змеи.
    this.speed = 100; // Скорость перемещения.
    this.createSnake(); // Создание начальной змеи.
    this.setupControls(); // Настройка управления.
  }

  teleport(food) {
    const head = this.segments[0];
    head.x = food.food.x;
    head.y = food.food.y;

    // Передвигаем сегменты тела один за другим.
    for (let i = this.segments.length - 1; i > 0; i--) {
      this.segments[i].x = this.segments[i - 1].x;
      this.segments[i].y = this.segments[i - 1].y;
    }
  }

  // Создание начальной змеи.
  createSnake() {
    for (let i = 0; i < START_LENGTH; i++) {
      const segment = new PIXI.Graphics();
      segment.beginFill(0x00ff00); // Зелёный цвет сегментов.
      segment.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
      segment.endFill();
      segment.x = (START_LENGTH - i) * CELL_SIZE;
      segment.y = 0;
      this.segments.push(segment); // Добавляем сегмент в массив.
      app.stage.addChild(segment); // Добавляем сегмент на сцену.
    }
  }

  // Настройка управления.
  setupControls() {
    window.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "ArrowUp":
          if (this.direction !== "down") this.direction = "up";
          break;
        case "ArrowDown":
          if (this.direction !== "up") this.direction = "down";
          break;
        case "ArrowLeft":
          if (this.direction !== "right") this.direction = "left";
          break;
        case "ArrowRight":
          if (this.direction !== "left") this.direction = "right";
          break;
      }
    });
  }

  // Логика движения змеи.
  move() {
    const head = this.segments[0]; // Головной сегмент змеи.
    let newX = head.x;
    let newY = head.y;

    // Определяем новое положение головы.
    switch (this.direction) {
      case "up":
        newY -= CELL_SIZE;
        break;
      case "down":
        newY += CELL_SIZE;
        break;
      case "left":
        newX -= CELL_SIZE;
        break;
      case "right":
        newX += CELL_SIZE;
        break;
    }

    if (gameMode === "god") {
      // Проверяем выход за границы и телепортируем голову на противоположную сторону
      if (newX < 0) {
        newX = FIELD_SIZE.x * CELL_SIZE - CELL_SIZE + 110; // Правая граница → телепортируем на левую сторону
      } else if (newX >= FIELD_SIZE.x * CELL_SIZE + 100) {
        newX = 0; // Левая граница → телепортируем на правую сторону
      }

      if (newY < 0) {
        newY = FIELD_SIZE.y * CELL_SIZE - CELL_SIZE + 110; // Нижняя граница → телепортируем на верхнюю сторону
      } else if (newY >= FIELD_SIZE.y * CELL_SIZE + 110) {
        newY = 0; // Верхняя граница → телепортируем на нижнюю сторону
      }

      // Передвигаем все сегменты змеи.
      for (let i = this.segments.length - 1; i > 0; i--) {
        this.segments[i].x = this.segments[i - 1].x;
        this.segments[i].y = this.segments[i - 1].y;
      }

      // Новое положение головы.
      head.x = newX;
      head.y = newY;
    } else {
      // Проверяем границы поля.
      // Передвигаем все сегменты змеи.
      for (let i = this.segments.length - 1; i > 0; i--) {
        this.segments[i].x = this.segments[i - 1].x;
        this.segments[i].y = this.segments[i - 1].y;
      }

      // Новое положение головы.
      head.x = newX;
      head.y = newY;
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= FIELD_SIZE.x * CELL_SIZE || // Исправлено
        head.y >= FIELD_SIZE.y * CELL_SIZE || // Исправлено
        walls.some((wall) => wall.x === head.x && wall.y === head.y)
      ) {
        this.isAlive = false; // Если вышли за пределы, игра заканчивается.
      }
    }
  }

  // Проверка на столкновение с едой.
  checkCollisionWithFood(food) {
    const head = this.segments[0];
    if (head.x === food.food.x && head.y === food.food.y) {
      this.grow(); // Змея растёт при поедании.
      if (gameMode === "walls") {
        new Wall();
      }

      return true;
    }
    return false;
  }

  // Растём после поедания еды.
  grow() {
    const newSegment = new PIXI.Graphics();
    newSegment.beginFill(0x00ff00);
    newSegment.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
    newSegment.endFill();
    const lastSegment = this.segments[this.segments.length - 1];
    newSegment.x = lastSegment.x;
    newSegment.y = lastSegment.y;
    this.segments.push(newSegment);
    app.stage.addChild(newSegment); // Добавляем новый сегмент к змее.
  }

  // Проверка на столкновение с телом (классический режим).
  checkCollisionWithSelf() {
    const head = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
        this.isAlive = false; // Змея столкнулась с собой.
      }
    }
  }
}

// Класс для создания стен
class Wall {
  constructor() {
    this.wall = new PIXI.Graphics();
    this.wall.beginFill(0x000000);
    this.wall.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
    this.wall.endFill();
    this.spawn();
    app.stage.addChild(this.wall);
    walls.push(this.wall);
  }

  spawn() {
    let validPosition = false;

    while (!validPosition) {
      const randomX = Math.floor(Math.random() * FIELD_SIZE.x) * CELL_SIZE;
      const randomY = Math.floor(Math.random() * FIELD_SIZE.y) * CELL_SIZE;

      validPosition = !walls.some(
        (wall) => wall.x === randomX && wall.y === randomY
      );

      if (validPosition) {
        this.wall.x = randomX;
        this.wall.y = randomY;
      }
    }
  }
}

// 6. Главный класс игры.
class Game {
  constructor() {
    this.snake = null; // Начальное значение для змеи.
    this.food = null; // Начальное значение для еды.
    this.food2 = null;
    this.gui = new GUI(); // Инициализация GUI.
    this.playing = false; // Статус игры.
    this.setupPlayButton(); // Настройка кнопки "Играть".
    this.speed = 1; // Начальная скорость змеи (уменьшите это значение для замедления).
    this.gameLoopHandle = null; // Сохранение ссылки на обработчик игрового цикла.
    this.lastUpdateTime = 0; // Время последнего обновления.
  }

  // Настройка кнопки "Играть".
  setupPlayButton() {
    playButton.addEventListener("click", (e) => {
      e.preventDefault(); // Предотвращаем перезагрузку страницы, если кнопка в форме

      // Получаем выбранное радио
      const selectedMode = document.querySelector(
        'input[name="mode"]:checked'
      ).value;

      console.log("Выбранный режим:", selectedMode);
      gameMode = selectedMode;
      this.startGame(); // Начинаем игру при нажатии на кнопку.
    });

    exitButton.addEventListener("click", () => {
      this.exitGame(); // Выход из игры.
    });
  }

  // Запуск игры.
  // Запуск игры
  startGame() {
    // Остановка предыдущей игры, если она была

    console.log("IS PLAYING: ", this.playing);
    if (this.playing) {
      this.exitGame();
    }

    this.snake = new Snake();
    this.food = new Food(this.snake);
    if (gameMode === "portal") this.food2 = new Food(this.snake);
    this.playing = true;
    modeForm.style.display = "none";
    this.gui.currentScore = 0;
    currentScore.textContent = this.gui.currentScore;

    // Запускаем игровой цикл
    this.startGameLoop(gameMode);
  }

  // Остановка игры
  exitGame() {
    this.playing = false; // Устанавливаем статус игры как "не играется".
    if (this.gameLoopHandle) {
      app.ticker.remove(this.gameLoopHandle); // Убираем обработчик игрового цикла.
      this.gameLoopHandle = null; // Сбрасываем ссылку.
    }
    // Сбрасываем змею и еду
    this.snake.segments.forEach((segment) => app.stage.removeChild(segment)); // Убираем сегменты змеи с экрана
    walls = [];
    this.food.food.destroy(); // Удаляем еду
    this.snake = null; // Убираем ссылку на змею
    this.food = null; // Убираем ссылку на еду
    modeForm.style.display = "block";
    this.gui.updateScore(0);
  }

  // Основной цикл игры.
  // Основной цикл игры
  startGameLoop() {
    this.gameLoopHandle = (delta) => {
      if (this.playing && this.snake.isAlive) {
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime > 1000 / (10 * this.speed)) {
          this.snake.move(); // Двигаем змею.
          this.lastUpdateTime = currentTime;

          if (gameMode === "portal") {
            if (this.snake.checkCollisionWithFood(this.food)) {
              this.snake.teleport(this.food2);
              this.food.spawn(); // Спавним новый портал на месте первого.
              this.snake.grow();
            } else if (this.snake.checkCollisionWithFood(this.food2)) {
              this.snake.teleport(this.food);
              this.food2.spawn();
              this.snake.grow();
            }
            const newScore = this.snake.segments.length - START_LENGTH; // Новая оценка
            this.gui.updateScore(newScore); // Обновляем счёт
          } else if (this.snake.checkCollisionWithFood(this.food, 1)) {
            this.food.spawn(); // Спавним новую еду.
            const newScore = this.snake.segments.length - START_LENGTH; // Новая оценка
            this.gui.updateScore(newScore); // Обновляем счёт
            if (gameMode === "speed") {
              this.speed *= 1.1;
              console.log("speed", this.speed);
            }
          }

          switch (gameMode) {
            case "classic":
              this.snake.checkCollisionWithSelf(); // Проверяем столкновение с телом.
              break;
            case "god":
              // Проверяем столкновение с телом.
              break;
            case "Classic3":
              this.snake.checkCollisionWithSelf(); // Проверяем столкновение с телом.
              break;
            case "Classic4":
              break;
          }
        }
      } else if (!this.snake.isAlive) {
        console.log("Game over");
        this.exitGame(); // Останавливаем игру при смерти змеи
      }
    };

    app.ticker.add(this.gameLoopHandle); // Добавляем обработчик игрового цикла.
  }

  // Запуск игры.
  start() {
    this.playing = true;
  }

  // Остановка игры.
  stop() {
    this.playing = false;
  }
}

// 7. Запускаем игру.
const game = new Game();
// game.start();

initializeGame();
