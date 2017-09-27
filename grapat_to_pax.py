#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Created on 23.07.2014

@author: Andreas Peldszus
'''

import re
import json
import argparse
from peewee import MySQLDatabase, Model, TextField, CharField, DateTimeField
from lxml import etree


# main variables
source_text_folder = ''
host = '127.0.0.1'  # 'localhost'
port = 3306
database = MySQLDatabase(
    'grapat',
    user='grapat_user_auth', passwd='supersecret',
    host=host, port=port)


map_node_type = {
    'node_type_proponent': 'pro',
    'node_type_opponent': 'opp'
}

map_edge_type = {
    'support': 'sup',
    'support_by_example': 'exa',
    'rebut': 'reb',
    'undercut': 'und',
    'additional_source': 'add'
}


def sorted_nicely(l):
    """
    Sorts the given iterable in the way that is expected.
    http://stackoverflow.com/a/2669120
    """
    def convert(text):
        return int(text) if text.isdigit() else text

    def alphanum_key(key):
        return [convert(c) for c in re.split('([0-9]+)', key)]

    return sorted(l, key=alphanum_key)


##############################################################################
# generated automatically by ...
# pwiz.py -e mysql -H localhost -u grapat_user_auth -P supersecret grapat > grapat_model.py
# (changed a little bit to integrate into the code)

class BaseModel(Model):
    class Meta:
        database = database


class Results(BaseModel):
    annotation_bundle = TextField(null=True)
    graph = TextField(null=True)
    layout = TextField(null=True)
    sentence = TextField(null=True)
    time = DateTimeField()
    username = TextField(null=True)

    class Meta:
        db_table = 'results'


class Users(BaseModel):
    firstname = CharField(db_column='FirstName', max_length=128, null=True)
    lastname = CharField(db_column='LastName', max_length=128, null=True)
    password = CharField(db_column='Password', max_length=255, null=True)
    username = CharField(db_column='UserName', max_length=128, null=True)

    class Meta:
        db_table = 'users'

#
##############################################################################


def query_latest_annotation(text_id, username):
    r = list(Results.select().where(
        (Results.sentence == text_id) & (Results.username == username)
    ).order_by(Results.time.desc()))
    if len(r) > 0:
        return r[0]
    else:
        return None


def read_edus_from_source_xml(text_id):
    edus = {}
    source_elm = etree.parse(source_text_folder + '/' + text_id + '.xml')
    token_range_elms = source_elm.xpath(
        '/annotation_bundle/entity[@id = $id ]/token_range', id=text_id)
    for token_range_elm in token_range_elms:
        edu_id = token_range_elm.get('id')
        edu_txt = token_range_elm.text
        edus[edu_id] = edu_txt
    return edus


def graph_to_xml(text_id, graph, edus, output_filename):
    doc_elm = etree.XML('<arggraph id="%s" />' % text_id)

    # a mapping from node_ids to xml_ids
    node_to_xml_ids = {}

    # serialize edus
    max_edu_id = 1
    for edu_id in sorted_nicely(list(edus.keys())):
        edu_text = edus[edu_id]
        new_edu_id = 'e%d' % max_edu_id
        node_to_xml_ids['word_%s' % edu_id] = new_edu_id
        max_edu_id += 1
        edu_elm = etree.XML('<edu id="%s" />' % new_edu_id)
        edu_elm.text = etree.CDATA(edu_text)
        doc_elm.append(edu_elm)

    # serialize joints
    max_joint_id = 1
    for k in sorted_nicely(graph['nodes'].keys()):
        v = graph['nodes'][k]
        if 'n_type' in v and v['n_type'] == 'node_type_edu_join':
            joint_id = 'j%d' % max_joint_id
            node_to_xml_ids[k] = joint_id
            max_joint_id += 1
            joint_elm = etree.XML('<joint id="%s" />' % joint_id)
            doc_elm.append(joint_elm)

    # serialize adus
    max_adu_id = 1
    for k in sorted_nicely(graph['nodes'].keys()):
        v = graph['nodes'][k]
        if v.get('n_type', None) in ['node_type_proponent',
                                     'node_type_opponent']:
            adu_type = map_node_type[v['n_type']]
            adu_id = 'a%d' % max_adu_id
            node_to_xml_ids[k] = adu_id
            max_adu_id += 1
            adu_elm = etree.XML('<adu id="%s" type="%s" />' % (adu_id, adu_type))
            doc_elm.append(adu_elm)

    # serialize edges
    to_edu_edges = []
    to_joint_edges = []
    to_adu_edges = []
    edge_to_xml_id = {}
    max_edge_id = 1

    def is_garbage_edge(source, attrib):
        return (attrib.get('c_type', None) is None and
                not source.startswith('word_'))

    def iter_edges(graph):
        for source in sorted_nicely(graph['edges'].keys()):
            for target in sorted_nicely(graph['edges'][source].keys()):
                for conn_id in sorted_nicely(graph['edges'][source][target].keys()):
                    attrib = graph['edges'][source][target][conn_id]
                    if not is_garbage_edge(source, attrib):
                        yield source, target, conn_id, attrib

    # first pass: register edges and relation nodes, skip garbage edges
    for source, target, conn_id, attrib in iter_edges(graph):
        edge_id = 'c%d' % max_edge_id
        max_edge_id += 1
        edge_to_xml_id[conn_id] = edge_id
        if attrib.get('label_node_id', None) is not None:
            node_to_xml_ids[attrib['label_node_id']] = edge_id

    # second pass: generate xml elements
    for source, target, conn_id, attrib in iter_edges(graph):
            edge_id = edge_to_xml_id[conn_id]
            source_id = node_to_xml_ids[source]
            target_id = node_to_xml_ids[target]
            if source.startswith('word_'):
                edge_elm = etree.XML(
                    '<edge id="%s" src="%s" trg="%s" type="seg" />' % (
                        edge_id, source_id, target_id))
                to_edu_edges.append(edge_elm)
            elif node_to_xml_ids[source].startswith('j'):
                edge_elm = etree.XML(
                    '<edge id="%s" src="%s" trg="%s" type="seg" />' % (
                        edge_id, source_id, target_id))
                to_joint_edges.append(edge_elm)
            else:
                edge_elm = etree.XML(
                    '<edge id="%s" src="%s" trg="%s" type="%s" />' % (
                        edge_id, source_id, target_id,
                        map_edge_type[attrib['c_type']]))
                to_adu_edges.append(edge_elm)

    # serialize in order
    for e in to_edu_edges:
        doc_elm.append(e)
    for j in to_joint_edges:
        doc_elm.append(j)
    for a in to_adu_edges:
        doc_elm.append(a)

    # write xml
    xmlstring = etree.tostring(
        doc_elm, encoding='UTF-8', pretty_print=True, xml_declaration=True)
    with open(output_filename, 'w') as outxml:
        outxml.write(xmlstring)


def save_xml_from_grapat(username, text_id, output_filename):
    print "Processing", text_id, "...",
    data = query_latest_annotation(text_id, username)
    if data is None:
        print "no annotated data could be retrieved."
        return

    try:
        edus = read_edus_from_source_xml(text_id)
    except IOError:
        print "no source xml file found to load the EDUs."
        return

    graph_to_xml(text_id, json.loads(data.graph), edus, output_filename)
    print "done."


def main():
    aparser = argparse.ArgumentParser(description="""
        Retrieve GraPAT annotations of argumentation structure from
        an its SQL server and save them as PAX arggraph xml files.
    """)
    aparser.add_argument(
        "-o", "--output-folder",
        help="the folder to write extracted xml to",
        default=".")
    aparser.add_argument(
        "-t", "--text-folder",
        help="the folder holding the source texts as grapat input xml",
        type=str, default="/var/lib/tomcat7/webapps/grapat/data/")

    # unfortunately, the database cannot be parametrized for peewee because
    # the database object to link with needs to be set before the peewee model
    # is loaded
    # aparser.add_argument(
    #     "-H", "--mysql-host",
    #     help=("mysql hostname (hint: use localhost for sockets, "
    #           "127.0.0.1 for tunneling)"),
    #     type=str, default="localhost")
    # aparser.add_argument(
    #     "-P", "--mysql-port",
    #     help="mysql port", type=int, default=3306)

    aparser.add_argument("annotator", help="the annotators login name")
    aparser.add_argument("textid", help="textid to extract", nargs='+')
    args = aparser.parse_args()

    # set source folder
    global source_text_folder
    source_text_folder = args.text_folder

    # extract texts
    for textid in args.textid:
        save_xml_from_grapat(
            args.annotator, textid, args.output_folder + '/' + textid + '.xml')


if __name__ == '__main__':
    main()
