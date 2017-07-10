## Prerequisites

- Java JDK 1.7+
- Maven
- Firefox
- Geckodriver (Firefox WebDriver)
- Xvfb

## System packages required
- bzip2
- firefox
- fontconfig
- gnu-free-sans-fonts
- maven
- xorg-x11-server-Xvfb

## Binaries required
- geckodriver (v0.17)

### Sample procedure for installing dependencies
```bash
yum -y install \
    bzip2 \
    firefox \
    fontconfig \
    gnu-free-sans-fonts \
    maven \
    xorg-x11-server-Xvfb

curl -L https://github.com/mozilla/geckodriver/releases/download/v0.17.0/geckodriver-v0.17.0-linux64.tar.gz -o /tmp/geckodriver.tar.gz
tar xf /tmp/geckodriver.tar.gz -C /usr/local/bin geckodriver
chmod 755 /usr/local/bin/geckodriver

## if /var/lib/dbus/machine-id does not exist, generate it:
dbus-uuidgen > /var/lib/dbus/machine-id
```


## Running tests
The sample `pom.xml` in the `tests/` directory includes junit 4.11 and selenium 3.4.0. The website url is passed in as a system property through the xml file.
To execute the tests, ensure that a specified framebuffer is available:

```bash
Xvfb :10 -screen 1 1920x1080x24 +extension RANDR &
export DISPLAY=:10.1
```

Then, run `mvn test` in the `tests/` directory:

```bash
pushd /tests
mvn clean
mvn test "-Dwebsite.url=https://google.com"
```

The test results are stored in the `tests/target/surefire-reports/` directory. These reports can be published via the Jenkins JUnit plugin.