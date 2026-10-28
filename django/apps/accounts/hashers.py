"""bcryptjs-compatible password hashing.

The Express backend hashed passwords with `bcryptjs` at cost 10, which emits
`$2b$10$…`. Django's own BCryptPasswordHasher is the same algorithm (name
"bcrypt") but defaults to cost 12, so this subclass keeps the original work
factor — a hash written here verifies there and vice versa.
"""

from django.contrib.auth.hashers import BCryptPasswordHasher


class BcryptJsPasswordHasher(BCryptPasswordHasher):
    iterations = 10
