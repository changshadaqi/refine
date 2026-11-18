<div align="center" style="margin: 30px;">
<a href="https://refine.dev/">
  <img alt="refine logo" src="https://refine.ams3.cdn.digitaloceanspaces.com/readme/refine-readme-banner.png">
</a>

<br />
<br />

<div align="center">
    <a href="https://refine.dev">Home Page</a> |
    <a href="https://discord.gg/refine">Discord</a> |
    <a href="https://refine.dev/examples/">Examples</a> |
    <a href="https://refine.dev/blog/">Blog</a> |
    <a href="https://refine.dev/docs/">Documentation</a>
</div>
</div>

<br />

# refine with Laravel

A CRUD example that connects **refine** to a **Laravel** REST API:

- a custom data provider for Laravel pagination, sorting and `filter[...]` params,
- Sanctum personal access token authentication (`login` / `logout` / `user`),
- `posts` and `categories` resources with list, create, edit, show and delete,
- search + sorting + pagination handled on the server.

## Requirements

- Node.js 20+
- PHP 8.3+ and Composer
- Laravel 13

## Frontend

```bash
# from the root of the refine repository
pnpm install
pnpm --filter with-laravel dev
```

The dev server runs on <http://localhost:5173>. Vite proxies `/api` so the
browser stays on the same origin and the Laravel app needs no CORS setup.
Two variables in `.env` control this:

```bash
# browser-facing URL — keep it relative to use the proxy
VITE_API_URL=/api
# upstream Laravel app (no trailing /api)
VITE_API_PROXY_TARGET=http://localhost:8000
```

To call a separate API domain directly instead, set `VITE_API_URL` to the full
API URL and allow your frontend origin in the backend's CORS config.

The example ships with `/login` and `/register`. Registering creates the user,
stores the returned Sanctum token and redirects to `/`.

## Backend

The frontend expects a Laravel 13 application. The snippets below are the
minimal setup needed for this example.

### 1. Create the application

`composer create-project` installs the latest Laravel release. To pin the
project to Laravel 13 explicitly:

```bash
composer create-project laravel/laravel laravel-api "^13.0"
cd laravel-api
php artisan install:api   # installs Sanctum and creates routes/api.php
```

Add the `HasApiTokens` trait to `app/Models/User.php`:

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

### 2. Database

```bash
php artisan migrate
```

Create a single migration for the blog tables, or two separate ones:

```php
// database/migrations/2024_01_01_000000_create_blog_tables.php
public function up(): void
{
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->timestamps();
    });

    Schema::create('posts', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->longText('content');
        $table->enum('status', ['published', 'draft', 'rejected'])->default('draft');
        $table->foreignId('category_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });
}
```

### 3. Models

```php
// app/Models/Category.php
class Category extends Model
{
    protected $fillable = ['title'];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}

// app/Models/Post.php
class Post extends Model
{
    protected $fillable = ['title', 'content', 'status', 'category_id'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
```

### 4. Controllers

`app/Http/Controllers/PostController.php`:

```php
namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::query()->with('category');

        // filter[title][like]=%foo%, filter[status]=draft, filter[status][in]=draft,published
        foreach ($request->input('filter', []) as $field => $condition) {
            if (! in_array($field, ['title', 'content', 'status', 'category_id'])) {
                continue;
            }

            if (is_array($condition)) {
                foreach ($condition as $operator => $value) {
                    match ($operator) {
                        'like' => $query->where($field, 'like', $value),
                        'ne' => $query->where($field, '!=', $value),
                        'gt' => $query->where($field, '>', $value),
                        'gte' => $query->where($field, '>=', $value),
                        'lt' => $query->where($field, '<', $value),
                        'lte' => $query->where($field, '<=', $value),
                        'in' => $query->whereIn($field, explode(',', $value)),
                        'not_in' => $query->whereNotIn($field, explode(',', $value)),
                        default => null,
                    };
                }
            } else {
                $query->where($field, $condition);
            }
        }

        // sort=created_at&order=desc
        $sort = explode(',', $request->query('sort', 'created_at'));
        $order = explode(',', $request->query('order', 'desc'));

        foreach ($sort as $index => $column) {
            if (! in_array($column, ['id', 'title', 'status', 'created_at'])) {
                continue;
            }

            $query->orderBy($column, ($order[$index] ?? 'asc') === 'desc' ? 'desc' : 'asc');
        }

        return $query->paginate(min((int) $request->query('per_page', 10), 100));
    }

    public function store(Request $request)
    {
        $post = Post::create($this->validatePost($request));

        return $post->load('category');
    }

    public function show(Post $post)
    {
        return $post->load('category');
    }

    public function update(Request $request, Post $post)
    {
        $post->update($this->validatePost($request));

        return $post->load('category');
    }

    public function destroy(Post $post)
    {
        $post->delete();

        return response()->noContent();
    }

    private function validatePost(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:published,draft,rejected'],
            'category_id' => ['required', 'exists:categories,id'],
        ]);
    }
}
```

`app/Http/Controllers/CategoryController.php`:

```php
namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        foreach ($request->input('filter', []) as $field => $condition) {
            if ($field !== 'title') {
                continue;
            }

            is_array($condition)
                ? $query->where('title', 'like', $condition['like'] ?? '')
                : $query->where('title', $condition);
        }

        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $query->orderBy($sort, $order === 'desc' ? 'desc' : 'asc');

        return $query->paginate(min((int) $request->query('per_page', 10), 100));
    }

    public function store(Request $request)
    {
        return Category::create($this->validateCategory($request));
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $category->update($this->validateCategory($request));

        return $category;
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->noContent();
    }

    private function validateCategory(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);
    }
}
```

`app/Http/Controllers/AuthController.php`:

```php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        return response()->json([
            'token' => $user->createToken('refine')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'] ?? Str::before($data['email'], '@'),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'token' => $user->createToken('refine')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function me(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
```

### 5. Routes

`routes/api.php`:

```php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('posts', PostController::class);
    Route::apiResource('categories', CategoryController::class);
});
```

### 6. Seed data

The login form is pre-filled with `admin@example.com` / `password`, so create a
matching user when seeding:

```php
// database/seeders/DatabaseSeeder.php
use App\Models\Category;
use App\Models\Post;
use App\Models\User;

public function run(): void
{
    User::factory()->create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password',
    ]);

    $laravel = Category::create(['title' => 'Laravel']);
    $refine = Category::create(['title' => 'refine']);

    Post::create([
        'title' => 'Getting started with refine and Laravel',
        'content' => 'A post rendered with **Markdown** support.',
        'status' => 'published',
        'category_id' => $laravel->id,
    ]);

    Post::create([
        'title' => 'Draft: custom data provider',
        'content' => 'Work in progress.',
        'status' => 'draft',
        'category_id' => $refine->id,
    ]);
}
```

```bash
php artisan migrate --seed
php artisan serve
```

## API contract

| Method | Endpoint               | Returns                      |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/login`           | `{ token, user }`            |
| POST   | `/api/register`        | `201` + `{ token, user }`    |
| GET    | `/api/user`            | the authenticated user       |
| POST   | `/api/logout`          | `204 No Content`             |
| GET    | `/api/posts`           | paginated posts + `category` |
| GET    | `/api/posts/{id}`      | one post + `category`        |
| POST   | `/api/posts`           | the created post             |
| PATCH  | `/api/posts/{id}`      | the updated post             |
| DELETE | `/api/posts/{id}`      | `204 No Content`             |
| GET    | `/api/categories`      | paginated categories         |
| GET    | `/api/categories/{id}` | one category                 |
| POST   | `/api/categories`      | the created category         |
| PATCH  | `/api/categories/{id}` | the updated category         |
| DELETE | `/api/categories/{id}` | `204 No Content`             |

List requests sent by the data provider:

```text
GET /api/posts?page=1&per_page=10&sort=created_at&order=desc&filter[title][like]=%laravel%&filter[status]=draft
```

`getList` accepts any of these response shapes:

```json
{ "data": [], "total": 0 }
```

```json
{ "data": [], "meta": { "total": 0 } }
```

```json
[]
```

Single item requests accept `{ "data": { ... } }` (Laravel API resource) or a
plain object.

## Notes

- Authentication is optional. Remove `authProvider` from `<Refine>` and the
  `<Authenticated>` wrappers in `src/App.tsx` if your API is public.
- `and` / `or` filter groups are not translated by this data provider; extend
  `src/providers/data-provider.ts` if you need them.
- When using a separate API domain instead of the Vite proxy, publish and
  configure CORS (`php artisan config:publish cors`) and allow your frontend
  origin.

## Project structure

```text
src/
  providers/
    auth-provider.ts   # Sanctum token auth
    constants.ts       # API URL + token storage key
    data-provider.ts   # Laravel pagination/sort/filter mapping
    request.ts         # fetch wrapper with auth header + error mapping
  pages/
    posts/             # list / create / edit / show
    categories/        # list / create / edit
```
