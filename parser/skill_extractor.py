import re


SKILL_DICTIONARY = {

    # Programming

    "java": [
        "java"
    ],

    "python": [
        "python"
    ],

    "javascript": [
        "javascript",
        "js"
    ],

    "typescript": [
        "typescript"
    ],

    "c": [
        "c"
    ],

    "c++": [
        "c++",
        "cpp"
    ],

    "c#": [
        "c#",
        "c sharp"
    ],

    # Frontend

    "html": [
        "html",
        "html5"
    ],

    "css": [
        "css",
        "css3"
    ],

    "react": [
        "react",
        "reactjs",
        "react.js"
    ],

    "angular": [
        "angular",
        "angularjs"
    ],

    "vue": [
        "vue",
        "vue.js",
        "vuejs"
    ],

    # Backend

    "spring": [
        "spring framework"
    ],

    "spring boot": [
        "spring boot",
        "springboot"
    ],

    "node.js": [
        "node.js",
        "nodejs"
    ],

    "express.js": [
        "express.js",
        "expressjs"
    ],

    "django": [
        "django"
    ],

    "flask": [
        "flask"
    ],

    "fastapi": [
        "fastapi"
    ],

    # Databases

    "sql": [
        "sql"
    ],

    "mysql": [
        "mysql"
    ],

    "postgresql": [
        "postgresql",
        "postgres"
    ],

    "mongodb": [
        "mongodb",
        "mongo"
    ],

    "redis": [
        "redis"
    ],

    "oracle": [
        "oracle database",
        "oracle db"
    ],

    # Cloud

    "aws": [
        "aws",
        "amazon web services"
    ],

    "azure": [
        "microsoft azure",
        "azure"
    ],

    "gcp": [
        "google cloud",
        "gcp"
    ],

    # DevOps

    "docker": [
        "docker"
    ],

    "kubernetes": [
        "kubernetes",
        "k8s"
    ],

    "jenkins": [
        "jenkins"
    ],

    "git": [
        "git"
    ],

    "github": [
        "github"
    ],

    "gitlab": [
        "gitlab"
    ],

    # Data / AI

    "machine learning": [
        "machine learning"
    ],

    "deep learning": [
        "deep learning"
    ],

    "nlp": [
        "natural language processing",
        "nlp"
    ],

    "pandas": [
        "pandas"
    ],

    "numpy": [
        "numpy"
    ],

    "tensorflow": [
        "tensorflow"
    ],

    "pytorch": [
        "pytorch"
    ],

    "scikit-learn": [
        "scikit-learn",
        "sklearn"
    ],

    # General

    "rest api": [
        "rest api",
        "restful api",
        "restful services"
    ],

    "microservices": [
        "microservices",
        "microservice architecture"
    ],

    "linux": [
        "linux"
    ]
}


def contains_skill(text, alias):

    pattern = (
        r"(?<![A-Za-z0-9])"
        + re.escape(alias.lower())
        + r"(?![A-Za-z0-9])"
    )

    return re.search(
        pattern,
        text.lower()
    ) is not None


def extract_skills(text):

    found = []

    for canonical, aliases in SKILL_DICTIONARY.items():

        for alias in aliases:

            if contains_skill(text, alias):

                found.append(canonical)
                break

    return sorted(set(found))