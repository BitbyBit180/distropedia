"""bcrypt password hashing at cost 10.

Django's BCryptPasswordHasher is the same algorithm but defaults to cost 12;
this subclass pins the work factor to 10 so hashes read `$2b$10$…`.
"""

from django.contrib.auth.hashers import BCryptPasswordHasher


class Bcrypt10PasswordHasher(BCryptPasswordHasher):
    iterations = 10
