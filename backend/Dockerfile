FROM node:22-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk update && apk add --no-cache curl git go musl-dev openjdk17-jdk openjdk17-jmods libc6-compat python3 py3-pip unzip python3-dev build-base

# Instalar Python tools (taurus, locust)
RUN pip3 install --break-system-packages bzt locust

# Instalar k6
RUN curl -L https://github.com/grafana/k6/releases/download/v0.56.0/k6-v0.56.0-linux-amd64.tar.gz -o /tmp/k6.tar.gz && \
    mkdir -p /tmp/k6 && \
    tar -xzf /tmp/k6.tar.gz -C /tmp/k6 --strip-components=1 && \
    mv /tmp/k6/k6 /usr/local/bin/k6 && \
    chmod +x /usr/local/bin/k6 && \
    rm -rf /tmp/k6*

# Vegeta
RUN go install github.com/tsenart/vegeta/v12@latest && cp /root/go/bin/vegeta /usr/local/bin/vegeta

# Hey, Bombardier
RUN curl -L https://storage.googleapis.com/hey-releases/hey_linux_amd64 -o /usr/local/bin/hey && chmod +x /usr/local/bin/hey
RUN curl -L https://github.com/codesenberg/bombardier/releases/download/v1.2.6/bombardier-linux-amd64 -o /usr/local/bin/bombardier && chmod +x /usr/local/bin/bombardier

# === Suite de herramientas de seguridad (pentesting) ===
# Escaneo de red / servicios (paquetes disponibles en Alpine 3.24)
RUN apk add --no-cache nmap nmap-nping nmap-scripts nmap-nselibs masscan hydra apache2-utils perl perl-libwww perl-net-ssleay perl-lwp-protocol-https libpcap-dev curl-dev openssl-dev git autoconf automake libtool make gcc musl-dev

# Repos edge/testing para hping3 (no está en v3.24 estable)
RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk add --no-cache hping3

# Siege removed due to compilation issues on Alpine

# Nikto (escáner web de vulnerabilidades) - se instala desde GitHub
RUN git clone --depth 1 https://github.com/sullo/nikto.git /opt/nikto && \
    chmod +x /opt/nikto/program/nikto.pl && \
    ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto

# sqlmap (SQLi), wfuzz (fuzzing web), slowloris (ataque lento HTTP)
# wfuzz 2.4.5 exige pycurl<=7.43 (incompatible con Python 3.14), por eso instalamos
# pycurl moderno primero y wfuzz desde git (3.1.0) sin reinstalar pycurl.
ENV PYCURL_SSL_LIBRARY=openssl
RUN apk add --no-cache py3-setuptools
RUN pip3 install --break-system-packages --no-cache-dir pycurl sqlmap slowloris && \
    pip3 install --break-system-packages --no-cache-dir --no-deps git+https://github.com/xmendez/wfuzz.git

# Gobuster y ffuf (enumeración / fuzzing)
RUN go install github.com/OJ/gobuster/v3@latest && cp /root/go/bin/gobuster /usr/local/bin/gobuster
RUN go install github.com/ffuf/ffuf/v2@latest && cp /root/go/bin/ffuf /usr/local/bin/ffuf

# JMeter
RUN curl -L https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz -o /tmp/jmeter.tar.gz && \
    mkdir -p /opt/jmeter && \
    tar -xzf /tmp/jmeter.tar.gz -C /opt/jmeter --strip-components=1 && \
    ln -s /opt/jmeter/bin/jmeter /usr/local/bin/jmeter

# Gatling
RUN curl -L https://repo1.maven.org/maven2/io/gatling/highcharts/gatling-charts-highcharts-bundle/3.14.9.1/gatling-charts-highcharts-bundle-3.14.9.1-bundle.zip -o /tmp/gatling.zip && \
    unzip /tmp/gatling.zip -d /opt/ && \
    rm -f /opt/gatling-charts-highcharts-bundle-3.14.9.1/bin/gatling.sh 2>/dev/null; \
    cd /opt/gatling-charts-highcharts-bundle-3.14.9.1 && \
    cp pom.xml pom.xml.orig && \
    cat pom.xml.orig | head -n 9 > pom.xml && \
    echo '  <dependencies>' >> pom.xml && \
    echo '    <dependency>' >> pom.xml && \
    echo '      <groupId>io.gatling.highcharts</groupId>' >> pom.xml && \
    echo '      <artifactId>gatling-charts-highcharts</artifactId>' >> pom.xml && \
    echo '      <version>3.14.9</version>' >> pom.xml && \
    echo '      <scope>test</scope>' >> pom.xml && \
    echo '    </dependency>' >> pom.xml && \
    echo '    <dependency>' >> pom.xml && \
    echo '      <groupId>org.scala-lang</groupId>' >> pom.xml && \
    echo '      <artifactId>scala-library</artifactId>' >> pom.xml && \
    echo '      <version>2.13.16</version>' >> pom.xml && \
    echo '    </dependency>' >> pom.xml && \
    echo '  </dependencies>' >> pom.xml && \
    echo '  <build>' >> pom.xml && \
    echo '    <plugins>' >> pom.xml && \
    echo '      <plugin>' >> pom.xml && \
    echo '        <artifactId>maven-compiler-plugin</artifactId>' >> pom.xml && \
    echo '        <version>3.14.1</version>' >> pom.xml && \
    echo '      </plugin>' >> pom.xml && \
    echo '      <plugin>' >> pom.xml && \
    echo '        <artifactId>maven-resources-plugin</artifactId>' >> pom.xml && \
    echo '        <version>3.3.1</version>' >> pom.xml && \
    echo '      </plugin>' >> pom.xml && \
    echo '      <plugin>' >> pom.xml && \
    echo '        <artifactId>maven-jar-plugin</artifactId>' >> pom.xml && \
    echo '        <version>3.4.2</version>' >> pom.xml && \
    echo '      </plugin>' >> pom.xml && \
    echo '      <plugin>' >> pom.xml && \
    echo '        <groupId>net.alchim31.maven</groupId>' >> pom.xml && \
    echo '        <artifactId>scala-maven-plugin</artifactId>' >> pom.xml && \
    echo '        <version>4.9.2</version>' >> pom.xml && \
    echo '        <executions>' >> pom.xml && \
    echo '          <execution>' >> pom.xml && \
    echo '            <goals>' >> pom.xml && \
    echo '              <goal>compile</goal>' >> pom.xml && \
    echo '              <goal>testCompile</goal>' >> pom.xml && \
    echo '            </goals>' >> pom.xml && \
    echo '          </execution>' >> pom.xml && \
    echo '        </executions>' >> pom.xml && \
    echo '      </plugin>' >> pom.xml && \
    echo '      <plugin>' >> pom.xml && \
    echo '        <groupId>io.gatling</groupId>' >> pom.xml && \
    echo '        <artifactId>gatling-maven-plugin</artifactId>' >> pom.xml && \
    echo '        <version>4.20.8</version>' >> pom.xml && \
    echo '      </plugin>' >> pom.xml && \
    echo '    </plugins>' >> pom.xml && \
    echo '  </build>' >> pom.xml && \
    echo '</project>' >> pom.xml && \
    rm pom.xml.orig && \
    echo 'gatling OK'

COPY package*.json ./
RUN npm install

COPY . .

ENV PATH="/usr/local/bin:${PATH}"
EXPOSE 8080
CMD ["npm", "run", "dev"]

