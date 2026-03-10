FROM andrius/asterisk:latest

USER root

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Generate self-signed TLS cert for WebSocket
RUN mkdir -p /etc/asterisk/keys && \
    openssl req -x509 -nodes -days 3650 \
    -newkey rsa:2048 \
    -keyout /etc/asterisk/keys/asterisk.key \
    -out /etc/asterisk/keys/asterisk.pem \
    -subj "/CN=localhost"

COPY config/pjsip.conf /etc/asterisk/pjsip.conf
COPY config/extensions.conf /etc/asterisk/extensions.conf
COPY config/http.conf /etc/asterisk/http.conf
COPY config/modules.conf /etc/asterisk/modules.conf

EXPOSE 5060/udp 5060/tcp 8089/tcp 10000-10020/udp

CMD ["asterisk", "-fvvv"]
